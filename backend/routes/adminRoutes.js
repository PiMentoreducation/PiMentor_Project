const express = require("express");
const router = express.Router(); 

// Models - Ensure these match your file names in /models exactly
const User = require("../models/User");
const Course = require("../models/Course");
const Purchase = require("../models/Purchase");
const Lecture = require("../models/Lecture"); 
const Doubt = require("../models/Doubt");

// Middlewares
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/admin");

/* ================= COURSE MANAGEMENT ================= */

// This matches the fetch in your admin.html: /api/admin/all-courses
router.get("/all-courses", auth, admin, async (req, res) => {
  try {
    const courses = await Course.find({}, "courseId title");
    res.json(courses);
  } catch (err) {
    console.error("Fetch Courses Error:", err);
    res.status(500).json({ message: "Error fetching courses" });
  }
});

router.post("/course", auth, admin, async (req, res) => {
  try {
    const { courseId, title, className, price, description, notesLink } = req.body;
    if (!courseId || !title || !className || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    const exists = await Course.findOne({ courseId });
    if (exists) return res.status(400).json({ message: "Course ID already exists." });

    const course = await Course.create({ 
      courseId, 
      title, 
      className, 
      price, 
      description, 
      notesLink 
    });
    res.status(201).json({ message: "Course created successfully!", course });
  } catch (error) {
    console.error("Create Course Error:", error);
    res.status(500).json({ message: "Server error while creating course" });
  }
});

// Delete an entire course and its associated lectures
router.delete("/course/:courseId", auth, admin, async (req, res) => {
    try {
        const { courseId } = req.params;
        await Course.findOneAndDelete({ courseId });
        await Lecture.deleteMany({ courseId });
        res.json({ message: "Course and all associated lectures wiped." });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete course" });
    }
});

/* ================= LECTURE MANAGEMENT ================= */

router.post("/course/:courseId/lecture", auth, admin, async (req, res) => {
  try {
    const { courseId } = req.params; 
    const { lectureTitle, videoUrl, duration, pdfNotes, practiceMcq, chapterName, topicName, order } = req.body; 

    const newLecture = new Lecture({
        courseId,
        title: lectureTitle,
        videoUrl,
        duration: duration || "0:00",
        pdfNotes: pdfNotes || "",
        practiceMcq: practiceMcq || "",
        chapterName,
        topicName,
        order: parseInt(order) || 0
    });

    await newLecture.save();
    res.status(201).json({ success: true, message: `Lecture added to ${chapterName}!` });
  } catch (error) {
    console.error("Lecture Save Error:", error);
    res.status(500).json({ message: "Error saving lecture to database" });
  }
});

router.delete("/course/:courseId/lecture/:lectureId", auth, admin, async (req, res) => {
    try {
        await Lecture.findByIdAndDelete(req.params.lectureId);
        res.status(200).json({ message: "Lecture removed successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting lecture" });
    }
});

/* ================= DOUBT RESOLUTION CENTER ================= */

router.get("/doubts/:courseId", auth, admin, async (req, res) => {
    try {
        const { courseId } = req.params;
        const doubts = await Doubt.find({ courseId, status: "Pending" }).sort({ createdAt: -1 });
        res.status(200).json(doubts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching pending doubts" });
    }
});

router.post("/resolve-doubt", auth, admin, async (req, res) => {
    try {
        const { doubtId, answer } = req.body;
        const updatedDoubt = await Doubt.findByIdAndUpdate(
            doubtId,
            { answer, status: "Resolved" },
            { new: true }
        );
        if (!updatedDoubt) return res.status(404).json({ message: "Doubt record not found" });
        res.status(200).json({ message: "Doubt resolved and answer saved!" });
    } catch (error) {
        res.status(500).json({ message: "Error updating doubt status" });
    }
});

router.delete("/clear-resolved-doubts", auth, admin, async (req, res) => {
    try {
        const result = await Doubt.deleteMany({ status: "Resolved" });
        res.json({ message: `${result.deletedCount} resolved doubts cleared from storage.` });
    } catch (error) {
        res.status(500).json({ message: "Cleanup operation failed" });
    }
});

module.exports = router;