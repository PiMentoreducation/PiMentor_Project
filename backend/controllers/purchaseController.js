// backend/controllers/purchaseController.js
const Purchase = require("../models/Purchase");
const Course = require("../models/Course");

exports.buyCourse = async (req, res) => {
    try {
        const { courseId, paymentId } = req.body;
        const cleanId = courseId.trim();
        
        // Use .lean() to get a plain JS object, bypassing Mongoose "magic"
        const course = await Course.findOne({ courseId: cleanId }).lean();
        
        if (!course) return res.status(404).json({ message: "Course not found" });

        // --- THE MATH REPAIR ---
        const now = new Date();
        let finalExpiry;

        // Force parse the date from your screenshot format
        const liveLimit = course.liveValidityDate ? new Date(course.liveValidityDate) : null;
        
        if (liveLimit && !isNaN(liveLimit.getTime()) && now.getTime() <= liveLimit.getTime()) {
            // Case: Live Phase
            finalExpiry = new Date(liveLimit.getTime());
        } else {
            // Case: Recorded Phase
            finalExpiry = new Date(now.getTime());
            // Fallback to 90 (from your screenshot) or 365
            const days = parseInt(course.recordedDurationDays) || 365;
            finalExpiry.setDate(finalExpiry.getDate() + days);
        }

        // Final Safety Check: If math somehow produced an invalid date
        if (isNaN(finalExpiry.getTime())) {
            finalExpiry = new Date();
            finalExpiry.setFullYear(finalExpiry.getFullYear() + 1);
        }

        const purgeDate = new Date(finalExpiry.getTime());
        purgeDate.setDate(purgeDate.getDate() + 10);

        // --- THE ATOMIC BYPASS ---
        // We do NOT use 'new Purchase()'. we use a plain object.
        const rawPurchaseData = {
            userId: req.user.id,
            courseId: cleanId,
            title: course.title || "Untitled Course",
            price: course.price || 0,
            paymentId: paymentId,
            className: course.className || "",
            expiryDate: finalExpiry, // This is now a guaranteed Date object
            purgeAt: purgeDate,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // This talks DIRECTLY to the database engine
        const result = await Purchase.collection.insertOne(rawPurchaseData);

        console.log(`✅ [DB_DIRECT] Inserted ID: ${result.insertedId} | Expiry: ${finalExpiry.toISOString()}`);
        
        res.status(201).json({ 
            success: true, 
            message: "Enrolled!", 
            debug_expiry: finalExpiry 
        });

    } catch (error) {
        console.error("❌ CRITICAL SYSTEM ERROR:", error);
        res.status(500).json({ message: "Server error" });
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