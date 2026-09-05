const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const speechSchema = new mongoose.Schema({
 
  text: {
    type: String,
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    
  },
  
  userLicense: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "UserLicense",
  },
  deleted: {
    type: Boolean,
    required: true,
    default : false,
  },

  


});

module.exports = mongoose.model('speech', speechSchema);