const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// In-memory OTP store
const otpStore = {};

// --- BREVO API SEND FUNCTION ---
const sendOTPEmail = async (email, otp) => {
    const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
    const emailData = {
        sender: { name: "PiMentor", email: process.env.GMAIL_USER },
        to: [{ email: email }],
        subject: "PiMentor: Your Verification Code",
        htmlContent: `<html><body><h1>PiMentor OTP</h1><p>Your code is <strong>${otp}</strong></p></body></html>`
    };

    try {
        await axios.post(BREVO_API_URL, emailData, {
            headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
        });
        return true;
    } catch (error) {
        console.error("Brevo Error:", error.response ? error.response.data : error.message);
        throw new Error("Email delivery failed.");
    }
};

// --- 1. SEND OTP ROUTE ---
router.post("/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };
        await sendOTPEmail(email, otp);
        res.status(200).json({ success: true, message: "OTP sent!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- 2. VERIFY OTP ROUTE ---
router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore[email];
    if (!record || Date.now() > record.expires) return res.status(400).json({ success: false, message: "OTP expired." });
    if (record.otp !== otp) return res.status(400).json({ success: false, message: "Invalid OTP." });
    delete otpStore[email];
    res.status(200).json({ success: true, message: "OTP verified!" });
});

// --- 3. REGISTER ROUTE ---
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, studentClass } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ success: false, message: "Already exists." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, password: hashedPassword, studentClass });
        await user.save();
        res.status(201).json({ success: true, message: "Registered!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error during registration." });
    }
});

// --- 4. LOGIN ROUTE (RESTORED) ---
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find user in database
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: "Invalid Email or Password" });

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid Email or Password" });

        // Generate JWT Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: "Server error during login" });
    }
});

module.exports = router;