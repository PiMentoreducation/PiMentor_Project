// backend/controllers/purchaseController.js
const Purchase = require("../models/Purchase");
const Course = require("../models/Course");

exports.buyCourse = async (req, res) => {
    try {
        const { courseId, paymentId } = req.body;
        const cleanId = courseId.trim();
        
        const course = await Course.findOne({ courseId: cleanId });
        if (!course) return res.status(404).json({ message: "Course not found" });

        // 1. ABSOLUTE NUMERICAL COMPARISON
        const nowMs = Date.now(); // Current time in milliseconds
        const liveLimitMs = course.liveValidityDate ? new Date(course.liveValidityDate).getTime() : 0;
        
        let finalExpiry;

        // If today (March 1) <= March 3 Midnight
        if (liveLimitMs > 0 && nowMs <= liveLimitMs) {
            // CASE: LIVE PHASE
            finalExpiry = new Date(liveLimitMs);
        } else {
            // CASE: RECORDED PHASE
            finalExpiry = new Date();
            const days = parseInt(course.recordedDurationDays) || 365;
            finalExpiry.setDate(finalExpiry.getDate() + days);
        }

        const purgeDate = new Date(finalExpiry);
        purgeDate.setDate(purgeDate.getDate() + 10);

        // 2. CREATE AND SAVE THE BASE RECORD
        const newPurchase = new Purchase({
            userId: req.user.id,
            courseId: cleanId,
            title: course.title,
            price: course.price,
            paymentId,
            className: course.className
        });

        const savedDoc = await newPurchase.save();

        // 3. BYPASS MONGOOSE SCHEMA (The "Nuclear" Option)
        // This writes directly to the MongoDB driver to force the fields into Atlas
        await Purchase.collection.updateOne(
            { _id: savedDoc._id },
            { 
                $set: { 
                    expiryDate: finalExpiry, 
                    purgeAt: purgeDate 
                } 
            }
        );

        console.log(`✅ [HARD-SYNC] Saved ${cleanId}. Expiry: ${finalExpiry.toISOString()}`);
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