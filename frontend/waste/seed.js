const mongoose = require('mongoose');
const Course = require('./models/Course');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to Cloud for seeding...");
    await Course.create({
      courseId: "m10",
      title: "Class 10 Mathematics",
      className: "10th",
      price: 499
    });
    console.log("✅ First course seeded to Cloud!");
    process.exit();
  })
  .catch(err => console.log(err));