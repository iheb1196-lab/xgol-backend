const mongoose = require("mongoose");


const licenseSchema = new mongoose.Schema({
  licenseType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LicenseType",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
credits : {
  type : Number,
  required: true,
},
experts:  [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
   
    },
    maxEvaluations: {
      type: Number,

    },
    remainingEvaluations: {
      type: Number,

    },
 
} ],

  corporate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Corporate",
    required: function () {
      return this.licenseType.toString() === "65b778d53f916531b1b232b3";
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  // in the corporate license agreement the license should have a start date and an end date
  startDate: {
    type: Date,
    required: function () {
      return this.licenseType.toString() === "65b778d53f916531b1b232b3";
    },
  },
  endDate: {
    type: Date,
    required: function () {
      return this.licenseType.toString() === "65b778d53f916531b1b232b3";
    },
  },
  numberOfUsers: {
    type: Number,
    default: 1,
    required: true,
  },
 // validity indicates tbe number of months for which the  license is valid  required for freemium license 
  validity: {
    type: Number,
    required: function () {
      return this.licenseType.toString() != "65b778d53f916531b1b232b3";
    },
  },
});

module.exports = mongoose.model("License", licenseSchema);
