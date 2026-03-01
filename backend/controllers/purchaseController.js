// backend/controllers/purchaseController.js
const Purchase = require("../models/Purchase");
// Inside purchaseController.js

const buyCourse = async (req, res) => {
    try {
        const { courseId, paymentId } = req.body;
        const course = await Course.findOne({ courseId });
        const now = new Date();
        let finalExpiry;

        // PRIORITY LOGIC
        const liveDate = new Date(course.liveValidityDate);
        if (now <= liveDate) {
            // If buying during Live/Ongoing phase
            finalExpiry = liveDate;
        } else {
            // If buying during Recorded phase
            finalExpiry = new Date();
            finalExpiry.setDate(finalExpiry.getDate() + (course.recordedDurationDays || 365));
        }

        // DATABASE PURGE DATE (10 Days Grace Period)
        const purgeDate = new Date(finalExpiry);
        purgeDate.setDate(purgeDate.getDate() + 10);

        const newPurchase = new Purchase({
            userId: req.user.id,
            courseId,
            title: course.title,
            price: course.price, 
            paymentId,
            expiryDate: finalExpiry,
            purgeAt: purgeDate
        });

        await newPurchase.save();
        res.status(201).json({ success: true, message: "Enrolled successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
const Course = require("../models/Course");

exports.buyCourse = async (req, res) => {
    try {
        const { courseId, paymentId } = req.body;
        const course = await Course.findOne({ courseId });
        
        if (!course) return res.status(404).json({ message: "Course not found" });

        const now = new Date();
        const liveLimit = course.liveValidityDate ? new Date(course.liveValidityDate) : null;
        
        let finalExpiry;

        // --- THE PIECEWISE LOGIC ---
        if (liveLimit && now <= liveLimit) {
            // Priority 1: On or before Course Validity Date
            finalExpiry = liveLimit;
        } else {
            // Priority 2: After Course Validity Date (Purchase + Duration)
            finalExpiry = new Date();
            const duration = parseInt(course.recordedDurationDays) || 365;
            finalExpiry.setDate(finalExpiry.getDate() + duration);
        }

        // Calculate Purge Date (Expiry + 10 Days)
        const purgeDate = new Date(finalExpiry);
        purgeDate.setDate(purgeDate.getDate() + 10);

        const newPurchase = new Purchase({
            userId: req.user.id,
            courseId,
            title: course.title,
            price: course.price,
            paymentId,
            // THESE TWO LINES ARE WHAT'S MISSING IN YOUR DB:
            expiryDate: finalExpiry, 
            purgeAt: purgeDate       
        });

        await newPurchase.save();
        res.status(201).json({ success: true, message: "Enrolled successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server error during enrollment" });
    }
};
exports.getMyCourses = async (req, res) => {
    try {
        const courses = await Purchase.find({ userId: req.user.id });
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch" });
    }
};