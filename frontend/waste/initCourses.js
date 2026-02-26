const mongoose = require("mongoose");
require("dotenv").config({ path: "./backend/.env" });

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pimentor";

// We define the schema inside the script to ensure it's linked correctly
const courseSchema = new mongoose.Schema({
    courseId: { type: String, required: true, unique: true },
    title: String,
    className: String,
    price: Number,
    description: String,
    lectures: [
  { lectureTitle: "Intro", videoUrl: "https://..." }
],
    notesLink: String
});

async function seedDB() {
    try {
        console.log("⏳ Connecting to local MongoDB...");
        // Use a variable for the connection
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000 // Fails fast if DB is down
        });
        console.log("✅ Connected successfully!");

        // Define the model ON the active connection
        const Course = conn.model("Course", courseSchema);

        const initialCourses = [
            {
                courseId: "math_calc_01",
                title: "Algebra",
                className: "Higher",
                price: 2999,
                description: "Complete Algebra course including Linear Equations and Quadratic Equations.",
                notesLink: "https://pimentor.education/notes/algebra10.pdf",
                lectures: [{lectureTitle: "Lesson 1: Introduction", videoUrl: "http"},{lectureTitle: "Lesson 1: Introduction", videoUrl: "http"}],
            }
        ];

        console.log("📝 Upserting data...");
        for (let course of initialCourses) {
            await Course.findOneAndUpdate(
                { courseId: course.courseId },
                course,
                { upsert: true, returnDocument: 'after' }
            );
            console.log(`📌 Seeded: ${course.title}`);
        }

        console.log("🚀 PiMentor Database Seeded Successfully!");
    } catch (error) {
        console.error("❌ Error Detail:", error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

seedDB();