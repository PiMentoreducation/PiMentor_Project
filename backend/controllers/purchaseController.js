// backend/controllers/purchaseController.js
const Purchase = require("../models/Purchase");
// Inside purchaseController.js

const buyCourse = async (req, res) => {
    try {
        const { courseId, paymentId } = req.body;
        const userId = req.user.id;

        const course = await Course.findOne({ courseId });
        if (!course) return res.status(404).json({ message: "Course not found" });

        // Calculate Expiry Date (Current Date + Course Validity Days)
        const expiry = new Date();
        const daysToAdd = course.validityDays || 365; // Default to 1 year if not set
        expiry.setDate(expiry.getDate() + daysToAdd);

        const newPurchase = new Purchase({
            userId,
            courseId: course.courseId,
            title: course.title,
            className: course.className,
            price: course.price,
            paymentId,
            expiryDate: expiry // This will now save correctly because of Step 1
        });

        await newPurchase.save();
        res.status(201).json({ success: true, message: "Purchase successful!" });
    } catch (error) {
        res.status(500).json({ message: "Server error during purchase" });
    }
};
exports.buyCourse = async (req, res) => {
    try {
        // We take these DIRECTLY from req.body (no 'course' wrapper)
        const { paymentId, courseId, title, className, price } = req.body;
        
        // Debugging: This will show in your VS Code terminal
        console.log("Saving Course ID:", courseId);

        const newPurchase = new Purchase({
            userId: req.user.id, // Successfully fixed by your new middleware!
            courseId,            // Simplified ES6 syntax
            title,
            className,
            price,
            paymentId,
            createdAt: new Date(),
            expiryDate: expiry, // This will now save correctly because of Step 1
        });

        await newPurchase.save();
        res.status(201).json({ message: "Purchase successful" });
    } catch (error) {
        console.error("Purchase Save Error:", error);
        res.status(500).json({ error: "Failed to save purchase" });
    }
};

exports.getMyCourses = async (req, res) => {
    try {
        const courses = await Purchase.find({ userId: req.user.id });
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch courses" });
    }
};