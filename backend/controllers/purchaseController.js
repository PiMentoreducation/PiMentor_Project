// backend/controllers/purchaseController.js
const Purchase = require("../models/Purchase");
const Course = require("../models/Course");

exports.buyCourse = async (req, res) => {
    try {
        const { courseId, paymentId } = req.body;
        
        // CLEANUP: Trim spaces to ensure a match
        const cleanCourseId = courseId.trim();
        const course = await Course.findOne({ courseId: cleanCourseId });
        
        if (!course) {
            console.error(`❌ Course NOT FOUND for ID: "${cleanCourseId}"`);
            return res.status(404).json({ message: "Course not found" });
        }

        const now = new Date();
        const liveLimit = course.liveValidityDate ? new Date(course.liveValidityDate).getTime() : null;
        let finalExpiry;

        if (liveLimit && now.getTime() <= liveLimit) {
            finalExpiry = new Date(liveLimit);
        } else {
            finalExpiry = new Date();
            const duration = parseInt(course.recordedDurationDays) || 365;
            finalExpiry.setDate(finalExpiry.getDate() + duration);
        }

        const purgeDate = new Date(finalExpiry);
        purgeDate.setDate(purgeDate.getDate() + 10);

        // CREATE BASIC DOC
        const newPurchase = new Purchase({
            userId: req.user.id,
            courseId: cleanCourseId,
            title: course.title,
            price: course.price,
            paymentId
        });

        const savedDoc = await newPurchase.save();

        // THE NUCLEAR STEP: Direct MongoDB Driver Update
        // This bypasses the Purchase.js schema entirely to force the write
        await Purchase.collection.updateOne(
            { _id: savedDoc._id },
            { 
                $set: { 
                    expiryDate: finalExpiry, 
                    purgeAt: purgeDate 
                } 
            }
        );
        
        console.log(`✅ [HARD-SYNC] Saved ${cleanCourseId} with Expiry: ${finalExpiry.toISOString()}`);
        res.status(201).json({ success: true, message: "Enrolled!" });

    } catch (error) {
        console.error("❌ FATAL PURCHASE ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ... keep getMyCourses as it is

exports.getMyCourses = async (req, res) => {
    try {
        const courses = await Purchase.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch" });
    }
};