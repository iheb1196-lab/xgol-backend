const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const videoSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },

  speech: {
    type: Schema.Types.ObjectId,
   
    ref: "speech",
  },
  topic: {
    type: String,

  },
  userLicense: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "UserLicense",
  },
  experts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  containerVideoName: {
    type: String,
  },
  containerAnalysisName: {
    type: String,
  },
  containerNameAudioAnalysis: {
    type: String,
  },
  videoBlobName: {
    type: String,
    required: true,
  },
  audioBlobName: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  isIndexed: {
    type: Boolean,
    default: false,
  },
  isPronunciationAssessed: {
    type: Boolean,
    default: false,
  },

  isEvaluated: {
    type: Boolean,
    default: false,
  },
  opened: {
    type: Boolean,
    default: false,
  },
  expertAssessmentRequired: {
    type: Boolean,
    default: false,
  },
  expertAssessmentRequestTime: {
    type: Date,
  },
  audioAnalysisBlobName: {
    type: String,
  },

  videoIndexerId: {
    type: String,
  },
  transcriptBlobName: {
    type: String,
  },
  thumbnailBlobName: {
    type: String,
  },
  videoIndexingerror: {
    type: Boolean,
  },
  videoIndexingErrorMessage: {
    type: Boolean,
  },
  videoIndexingInvocationId: {
    type: String,
  },
  evaluatedAt: {
    type: Date,
  },
  transcriptUrl: {
    type: String,
  },
  videoUrl: {
    type: String,
  },
  thumbnailUrl: {
    type: String,
  },
  duration: {
    type: Number,
  },
  // the type of the video indicated whether the video is coming from snack coaching , or it is a practise of a give speech
  // it can be : SNACK_COACHING || SPEECH_PRACTISE
  type: {
    type: String,
  },

  //coachevaluationVideos is an array containing the different video of expert evaluating the user's performance
  coachEvaluationVideos: [
    {
      videoName: {
        type: String,
      },
      dateOfUpload: {
        type: Date,
        default: Date.now,
      },
      user: {
        type: Schema.Types.ObjectId,

        ref: "User",
      },
      ratingByUser: {
        type: Number,
      },
      ratingByExpert: {
        type: Number,
      },
      feedbackByUser: {
        type: String,
      },
    },
  ],
  pronAssessmentAnalysis: {
    type: String,
  },

  deleted: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model("Video", videoSchema);
