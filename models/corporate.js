const mongoose = require('mongoose');

const corporateSchema = new mongoose.Schema({

name : {
    type: String,
    required: true,
    unique: true,
},
description : {
    type: String,
    required: true
},



});

module.exports = mongoose.model('Corporate', corporateSchema);