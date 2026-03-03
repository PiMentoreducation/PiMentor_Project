const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const razorpay = require("../utils/razorpay");
const { buyCourse } = require("../controllers/purchaseController");
const Course = require("../models/Course"); // 🔥 Moved to top for reliability

/* ================= CREATE ORDER ================= */
router.post("/create-order", auth, async (req, res) => {
  const { courseId } = req.body;

  try {
    // 1. Fetch course from DB using the unique courseId string
    const course = await Course.findOne({ courseId: String(courseId).trim() });

    if (!course) {
      console.error("Order creation failed: Course not found for ID:", courseId);
      return res.status(404).json({ message: "Course not found in database" });
    }

    // 2. Create Razorpay Order with actual price from DB
    const options = {
      amount: Math.round(Number(course.price) * 100), // Convert to paise
      currency: "INR",
      receipt: `rcpt_${courseId.substring(0, 10)}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json({ order });

  } catch (err) {
    console.error("Order creation failed:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
});

/* ================= VERIFY PAYMENT ================= */
router.post("/verify", auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      course // This is the metadata passed from frontend
    } = req.body;

    // 1. Signature Verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed: Signature Mismatch" });
    }

    // 2. Fetch the full course details from DB to ensure data integrity
    const dbCourse = await Course.findOne({ courseId: String(course.courseId).trim() });

    if (!dbCourse) {
      return res.status(404).json({ message: "Database update failed: Course record lost" });
    }

    // 3. Prepare the request body for the Purchase Controller
    // We overwrite req.body so the controller gets exactly what it needs
    req.body = {
      courseId: dbCourse.courseId,
      title: dbCourse.title,
      className: dbCourse.className,
      price: dbCourse.price,
      liveValidityDate: dbCourse.liveValidityDate,
      recordedDurationDays: dbCourse.recordedDurationDays,
      paymentId: razorpay_payment_id
    };

    // 4. Call the purchaseController.buyCourse to save to Dashboard
    return buyCourse(req, res);

  } catch (error) {
    console.error("VERIFY ERROR:", error);
    res.status(500).json({ message: "Internal Server Error during verification" });
  }
});

module.exports = router;