const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * One practice session: the user read a speech aloud, the audio was
 * recorded locally and evaluated by the AI coach.
 */
const practiceSessionSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  speech: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "speech",
  },
  userLicense: {
    type: Schema.Types.ObjectId,
    ref: "UserLicense",
  },
  objective: {
    type: String,
    default: "",
  },
  audioFile: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    default: "audio/wav",
  },
  duration: {
    type: Number,
    default: 0,
  },
  feedback: {
    type: String,
    default: "",
  },
  comparedToSession: {
    type: Schema.Types.ObjectId,
    ref: "PracticeSession",
    default: null,
  },
  status: {
    type: String,
    enum: ["PROCESSING", "COMPLETED", "FAILED"],
    default: "PROCESSING",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deleted: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model("PracticeSession", practiceSessionSchema);
