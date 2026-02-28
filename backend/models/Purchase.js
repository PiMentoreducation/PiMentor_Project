const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  courseId: String,
  title: String,
  className: String,
  price: Number,
  paymentId: String,
  createdAt: { type: Date, default: Date.now }, // NEW: Stores purchase date
  expiryDate: { type: Date } // NEW: Calculated based on course validity
});

module.exports = mongoose.model("Purchase", purchaseSchema);