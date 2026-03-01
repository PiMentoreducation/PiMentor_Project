// backend/controllers/purchaseController.js
const Purchase = require("../models/Purchase");
const Course = require("../models/Course");

exports.buyCourse = async (req, res) => {
    try {
        const { courseId, paymentId } = req.body;
        const cleanId = courseId.trim();
        
        // Use .lean() to bypass all Mongoose internal logic
        const course = await Course.findOne({ courseId: cleanId }).lean();
        if (!course) return res.status(404).json({ message: "Course not found" });

        const now = new Date();
        let finalExpiry;

        // --- THE "NO-FAIL" DATE LOGIC ---
        try {
            const liveLimit = course.liveValidityDate ? new Date(course.liveValidityDate) : null;
            
            if (liveLimit && !isNaN(liveLimit.getTime()) && now.getTime() <= liveLimit.getTime()) {
                finalExpiry = new Date(liveLimit.getTime());
            } else {
                finalExpiry = new Date();
                const days = parseInt(course.recordedDurationDays) || 365;
                finalExpiry.setDate(finalExpiry.getDate() + days);
            }
        } catch (e) {
            // Hard Fallback: 1 Year from today if anything above crashes
            finalExpiry = new Date();
            finalExpiry.setFullYear(finalExpiry.getFullYear() + 1);
        }

        // Final validation: If it's still not a valid date, force it.
        if (!finalExpiry || isNaN(finalExpiry.getTime())) {
            finalExpiry = new Date();
            finalExpiry.setFullYear(finalExpiry.getFullYear() + 1);
        }

        const purgeDate = new Date(finalExpiry.getTime() + 10 * 24 * 60 * 60 * 1000);

        // --- THE ATOMIC BYPASS ---
        const rawData = {
            userId: req.user.id,
            courseId: cleanId,
            title: course.title || "Untitled",
            price: course.price || 0,
            paymentId: paymentId,
            className: course.className || "",
            expiryDate: finalExpiry, // Guaranteed to be a Date object now
            purgeAt: purgeDate,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Bypass Mongoose entirely
        const result = await Purchase.collection.insertOne(rawData);

        console.log(`✅ [DB_DIRECT] Success! ID: ${result.insertedId} | Expiry: ${finalExpiry.toISOString()}`);
        
        res.status(201).json({ 
            success: true, 
            message: "Enrolled!",
            expirySet: finalExpiry.toISOString() 
        });

    } catch (error) {
        console.error("❌ CRITICAL SYSTEM ERROR:", error);
        res.status(500).json({ message: "Internal Server Error" });
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