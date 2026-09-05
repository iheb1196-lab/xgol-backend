const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
	firstName: { type: String },
	lastName: { type: String},
	userName: {type:String},
    emails: [{
        type: String,
        required:true
      }],
	
	password: { type: String},
	verified: { type: Boolean, default:false},
    role: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
           
            required: true,
        },
    ] ,
    /**Expert satistics *****/
    averageRatings : {
        type : Number,
        default : 0
    },
    numberOfRatings: {
        type : Number ,
        default: 0
    },
    numberOfVideosRecorded: {
        type: Number,
        default:0
    },
    totalDurationVideos: {
        type:Number,
        default:0

    },
    numberOfEvaluations: {
        type : Number,
        default: 0

    },
    //the average response time between the when the user sbmits an evaluation request , and actually receiving one of it 
    averageResponseTime: {
        type:Number,
        default:0
    },
    //the number of evaluations recorded by the expert
    numberOfEvaluationDone:{
        type :Number,
        default:0
    },

    hasSeenWalkthrough: { type: Boolean, default: false },
    corporate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Corporate',
        required: function() { return this.role.toString() === '65b27b0bde4d42970696d058'; } 
    }
    
});


module.exports = mongoose.model('User', userSchema);