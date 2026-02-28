const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    heading: { type: String, required: true },
    description: { type: String, required: true },
    link: { type: String, default: "" }, // Optional link for PDF or YouTube
    targetCourses: [{ type: String }],    // Array of Course IDs
    createdAt: { type: Date, default: Date.now, expires: 84000 } // Auto-deletes in 1 days
});

module.exports = mongoose.model("Notification", NotificationSchema);