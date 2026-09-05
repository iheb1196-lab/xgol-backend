const mongoose = require("mongoose");


const tokenSchema = new mongoose.Schema({
value : {
    type: String,
    required: true,
},
user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
}
    
});


module.exports = mongoose.model('Token', tokenSchema);