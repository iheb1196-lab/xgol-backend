const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  goal: { type: String, default: "Speak with confidence" },
  role: { type: String, default: "" },
  audience: { type: String, default: "" },
  challenge: { type: String, default: "" },
  level: { type: String, enum: ["starting", "developing", "experienced"], default: "developing" },
  language: { type: String, default: "English" },
  style: { type: String, enum: ["supportive", "direct", "challenging"], default: "supportive" },
  minutes: { type: Number, enum: [2, 5, 10], default: 5 },
  eventName: { type: String, default: "" },
  eventDate: { type: String, default: "" },
  availableForReviews: { type: Boolean, default: false },
  responseHours: { type: Number, default: 48 },
}, { timestamps: true });

module.exports = mongoose.model("CoachingProfile", schema);
