const mongoose = require("mongoose");

const errorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  operation: {
    type: String,
    required: true,
 
  },
  description: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Error", errorSchema);
