const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  courseId: String,
  title: String,
  price: Number,
  paymentId: String,
  expiryDate: { type: Date }, // Ensure this is exactly like this
  purgeAt: { type: Date }
}, { 
  timestamps: true,
  strict: false // This is the MAGIC FLAG - it tells Mongoose "Save anything I send you"
});

purchaseSchema.index({ "purgeAt": 1 }, { expireAfterSeconds: 0 });

// This logic prevents "OverwriteModelError" and forces the new schema
module.exports = mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema);