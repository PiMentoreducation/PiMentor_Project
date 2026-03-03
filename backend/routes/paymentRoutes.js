const express = require("express");
const crypto = require("crypto");
const router = express.Router(); // ✅ MUST exist

const auth = require("../middleware/authMiddleware");
const razorpay = require("../utils/razorpay");
const { buyCourse } = require("../controllers/purchaseController");

/* ================= CREATE ORDER ================= */
router.post("/create-order", auth, async (req, res) => {
  const { courseId } = req.body;

  try {
    const Course = require("../models/Course");

    const course = await Course.findOne({ courseId });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const order = await razorpay.orders.create({
      amount: Number(course.price) * 100,  // 🔥 get from DB
      currency: "INR",
      receipt: `rcpt_${courseId}_${Date.now()}`
    });

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
      course
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const Course = require("../models/Course");
    const dbCourse = await Course.findOne({ courseId: course.courseId });

    if (!dbCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    req.body = {
      courseId: dbCourse.courseId,
      title: dbCourse.title,
      className: dbCourse.className,
      price: dbCourse.price,
      liveValidityDate: dbCourse.liveValidityDate,
      recordedDurationDays: dbCourse.recordedDurationDays,
      paymentId: razorpay_payment_id
    };

    return buyCourse(req, res);

  } catch (error) {
    console.error("VERIFY ERROR:", error);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

module.exports = router;