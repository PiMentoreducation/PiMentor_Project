// backend/controllers/purchaseController.js
const Purchase = require("../models/Purchase");
const Course = require("../models/Course");

exports.buyCourse = async (req, res) => {
    try {
        const { courseId, paymentId } = req.body;
        const cleanId = courseId.trim();
        
        const course = await Course.findOne({ courseId: cleanId });
        if (!course) return res.status(404).json({ message: "Course not found" });

        // 1. Piecewise Logic (Timestamps)
        const nowMs = Date.now();
        const liveLimitMs = course.liveValidityDate ? new Date(course.liveValidityDate).getTime() : 0;
        
        let finalExpiry;
        if (liveLimitMs > 0 && nowMs <= liveLimitMs) {
            finalExpiry = new Date(liveLimitMs);
        } else {
            finalExpiry = new Date();
            const days = parseInt(course.recordedDurationDays) || 365;
            finalExpiry.setDate(finalExpiry.getDate() + days);
        }

        const purgeDate = new Date(finalExpiry);
        purgeDate.setDate(purgeDate.getDate() + 10);

        // 2. THE BYPASS: Use the raw collection to insert
        // This avoids the 'new Purchase().save()' filtering entirely.
        const purchaseData = {
            userId: req.user.id,
            courseId: cleanId,
            title: course.title,
            price: course.price,
            paymentId: paymentId,
            className: course.className,
            expiryDate: finalExpiry,
            purgeAt: purgeDate,
            createdAt: new Date(),
            updatedAt: new Date(),
            __v: 0
        };

        // We use Purchase.collection.insertOne to talk directly to MongoDB
        const result = await Purchase.collection.insertOne(purchaseData);

        console.log(`✅ [ATOMIC BYPASS] Inserted ID: ${result.insertedId}`);
        res.status(201).json({ success: true, message: "Enrolled!" });

    } catch (error) {
        console.error("❌ CRITICAL ERROR:", error);
        res.status(500).json({ message: "Server error during enrollment" });
    }
};
exports.getMyCourses = async (req, res) => {
    try {
        const courses = await Purchase.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch" });
    }
};