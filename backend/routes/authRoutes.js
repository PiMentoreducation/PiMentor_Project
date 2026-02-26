const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// --- BREVO INITIALIZATION ---
const SibApiV3Sdk = require("@getbrevo/brevo");

// We access the TransactionalEmailsApi via the SDK object
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Correct way to set API Key in Node.js
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// In-memory OTP store (expires in 10 mins)
const otpStore = {};

// --- HELPER: SEND OTP ---
const sendOTPEmail = async (email, otp) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = "PiMentor: Your Verification Code";
  sendSmtpEmail.htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #4CAF50; text-align: center;">Join PiMentor</h2>
          <p>Hello,</p>
          <p>Your OTP for account verification is:</p>
          <div style="text-align: center; font-size: 2.5rem; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #333;">
            ${otp}
          </div>
          <p>This code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 0.8rem; color: #777; text-align: center;">PiMentor Educational Services, Gorakhpur</p>
        </div>
      </body>
    </html>`;
  
  // SENDER: This email MUST be verified in your Brevo Dashboard
  sendSmtpEmail.sender = { name: "PiMentor", email: process.env.GMAIL_USER }; 
  sendSmtpEmail.to = [{ email: email }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[Brevo]: OTP sent successfully to ${email}`);
    return true;
  } catch (error) {
    // This will print the exact reason if it fails (e.g., "invalid sender")
    console.error("Brevo API Error Detail:", error.response ? error.response.body : error.message);
    throw new Error("Email service failed. Check your Brevo Dashboard.");
  }
};

// --- ROUTE: SEND OTP ---
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email is required" });

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = {
      otp,
      expires: Date.now() + 10 * 60 * 1000,
    };

    await sendOTPEmail(email, otp);
    res.status(200).json({ success: true, message: "OTP sent successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- ROUTE: VERIFY OTP ---
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) return res.status(400).json({ success: false, message: "OTP not found. Please resend." });
  if (Date.now() > record.expires) {
    delete otpStore[email];
    return res.status(400).json({ success: false, message: "OTP expired." });
  }
  if (record.otp !== otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP code." });
  }

  delete otpStore[email];
  res.status(200).json({ success: true, message: "OTP verified!" });
});

// --- ROUTE: REGISTER ---
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, studentClass } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      studentClass,
    });

    await user.save();
    res.status(201).json({ success: true, message: "Registration successful!" });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

module.exports = router;