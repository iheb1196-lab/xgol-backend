const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true },
  scenario: { type: String, required: true },
  source: { type: String, enum: ["snack", "learning"], default: "snack" },
  context: { type: String, default: "" },
  focus: { type: String, default: "" },
  profile: { type: Object, default: {} },
  audioFile: { type: String, default: "", select: false },
  duration: { type: Number, default: 0 },
  text: { type: String, default: "" },
  feedback: { type: String, default: "" },
  nextFocus: { type: String, default: "" },
  exercise: { type: String, default: "" },
  status: { type: String, enum: ["PROCESSING", "COMPLETED", "FAILED"], default: "PROCESSING" },
  previous: { type: mongoose.Schema.Types.ObjectId, ref: "CoachingSession", default: null },
  followup: { question: String, answer: String },
  followupPending: { type: Boolean, default: false, select: false },
  review: {
    coach: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    requestedAt: Date,
    expectedBy: Date,
    note: String,
    feedback: String,
    focus: String,
    exercise: String,
    moments: [{ seconds: Number, note: String }],
    reviewedAt: Date,
    question: String,
    answer: String,
  },
  helpful: { type: Boolean, default: null },
  appliedAt: Date,
  deleted: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ user: 1, deleted: 1, createdAt: -1 });
schema.index({ "review.coach": 1, deleted: 1 });
module.exports = mongoose.model("CoachingSession", schema);
