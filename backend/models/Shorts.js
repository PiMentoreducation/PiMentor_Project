const mongoose = require("mongoose");

const shortsSchema = new mongoose.Schema({
    shortId: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    icon: { type: String, default: "🚀" }, // Stores the Emoji for the Hub
    title: { type: String, required: true },
    ytUrl: { type: String, required: true },
    order: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model("Short", shortsSchema);