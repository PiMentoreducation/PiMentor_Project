const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  courseId: String,
  title: String,
  className: String,
  price: Number,
  paymentId: String,
  // EXPLICITLY ADD THIS FIELD
  expiryDate: { type: Date } 
}, { 
  // THIS AUTO-GENERATES 'createdAt' (Enrolled Date)
  timestamps: true 
});

module.exports = mongoose.model("Purchase", purchaseSchema);