const mongoose = require("mongoose");



const userLicenseSchema = new mongoose.Schema({
  license: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "License",
    required: true,
  },

  credits: {
    type: Number,
    required: true,
  },

  assignedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  activatedAt: {
    type: Date,
  },
  activated: {
    type: Boolean,
    default: false,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () {
      return this.activated;
    },
  },
  licenseSecret: {
    type: String,
    unique: true,
    required: function () {
      return this.license.toString() != "65b799b92267c99026b2fa75";
    },
  },
  licenseEmail: {
    type: String,
    required: true,
  },
  expiryDate: {
    type: String,
    required: true,
  },
  desactivatedAt: {
    type: Date,
  },
  snackCoachingExpert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }
});
// Create an index on the assignedAt field
userLicenseSchema.index({ activatedAt: -1 });

module.exports = mongoose.model("UserLicense", userLicenseSchema);
