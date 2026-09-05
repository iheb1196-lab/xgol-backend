const mongoose = require("mongoose");

const featureTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  credits: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("FeatureType", featureTypeSchema);
