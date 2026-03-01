// backend/models/Course.js
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  courseId: { type: String, required: true, unique: true, trim: true },
  title: String,
  className: String,
  price: Number,
  description: String,
  liveValidityDate: { type: Date }, 
  recordedDurationDays: { type: Number, default: 365 },
  lectures: [
    {
      lectureTitle: String,
      videoUrl: String,
      duration: String,
      pdfNotes: { type: String, default: "" },
      practiceMcq: { type: String, default: "" },
    }
  ],
}, { timestamps: true }); // Let Mongoose handle createdAt/updatedAt

module.exports = mongoose.model("Course", courseSchema);