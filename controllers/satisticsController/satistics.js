const Video = require("../../models/video");
const PracticeSession = require("../../models/practiceSession");
const CoachingSession = require("../../models/coachingSession");
const License = require("../../models/license");

const Speech = require("../../models/speech")
const Role = require("../../models/role");
const UserLicense = require("../../models/userLicense");
const UserJournal = require("../../models/userJournal")
const {
  hasRequiredDelegatedPermissions,
} = require("../../middleware/permissionUtils");
const User = require("../../models/user");
/**this should be updated corporate speech satistics , as i retrieve the licence from the req.body.license */
const calculateCorporateSpeechStatistics = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "FETCH_CORPORATE_LICENSES")) {
    try {
      const license = await License.findById({
        _id: req.params.license,
      }).populate("experts.user");
     

      const userLicenses = await UserLicense.find({
        license: req.params.license,
      }).populate("user");
      console.log(userLicenses);

      const numberOfUserWithLicenses = userLicenses.length;
      const numberOfAllowedUsersWithinLicense = license.numberOfUsers;

      let totalDuration = 0;
      let totalEvaluatedVideos = 0;
      let totalExpertRequested = 0;
      let userDetails = [];

      let numberOfSpeechesCreatedThisMonth = 0;
      let numberOfVideosRecordedThisMonth = 0;
      let totalDurationThisMonth = 0;

      // Get the current date, and the start and end of the current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      for (const license of userLicenses) {
        const videos = await Video.find({
          userLicense: license._id,
        });

        const durationSum = videos.reduce(
          (acc, video) => acc + (video.duration || 0),
          0
        );
        totalDuration += durationSum;
        const expertRequested = videos.filter(
          (video) => video.expertAssessmentRequired === true
        );
        const expertRequestedCount = expertRequested.length;
        totalExpertRequested += expertRequestedCount;

        // Filter out only evaluated videos and calculate their count for this license
        const evaluatedVideosForLicense = videos.filter(
          (video) => video.isEvaluated === true
        );
        
        
        const evaluatedVideosCount = evaluatedVideosForLicense.length;
        totalEvaluatedVideos += evaluatedVideosCount;

        // Calculate total duration of evaluated videos for this license
        const totalDurationEvaluatedVideos = videos.reduce(
          (acc, video) => acc + (video.duration || 0),
          0
        );
          // Calculate speeches created this month for this license
          const speechesThisMonth = await Speech.find({
            userLicense: license._id, // Assuming user is available in the license object
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
         
          });
  
          numberOfSpeechesCreatedThisMonth += speechesThisMonth.length;
             // Calculate videos recorded this month for this license
        const videosThisMonth = await Video.find({
          userLicense: license._id,
          uploadedAt: { $gte: startOfMonth, $lte: endOfMonth },
        
        });

        const numberOfVideosRecordedForLicenseThisMonth = videosThisMonth.length;
        numberOfVideosRecordedThisMonth += numberOfVideosRecordedForLicenseThisMonth;

        const durationThisMonthForLicense = videosThisMonth.reduce(
          (acc, video) => acc + (video.duration || 0),
          0
        );
        totalDurationThisMonth += durationThisMonthForLicense;

        const userDetailsEntry = {
          active: license.activated,
          email: license.licenseEmail,
          evaluatedVideosCount: evaluatedVideosCount,
          totalDurationEvaluatedVideos: totalDurationEvaluatedVideos,
        };

        // If a user is associated, add their details
        if (license.user) {
          userDetailsEntry.userId = license.user._id;
          userDetailsEntry.userName = license.user.userName;
          // You can add other user details here as necessary
        }

        userDetails.push(userDetailsEntry);
      }
      const expertRole = await Role.findOne({ name: "EXPERT" });

      if (!expertRole) {
        return res.status(404).json({ message: "EXPERT role not found." });
      }
  
    // Get all users with the EXPERT role
    const experts = await User.find({ role: expertRole._id });

    // Filter users who are not already in the license's experts array
    const unassignedExperts = experts.filter(
      (expert) => !license.experts.some((assignedExpert) => assignedExpert._id.equals(expert._id))
    );
    //console.log(unassignedExperts)
    const assignedExperts = experts.filter((expert) => 
      license.experts.some((assignedExpert) => assignedExpert._id.equals(expert._id))
    );
    console.log(license.experts)
    //console.log(assignedExperts)
      // Find top 5 experts by sorting them by averageRatings
      let topExperts = [];
      if (license.experts) {
        topExperts = license.experts
          .sort((a, b) => (b.user.averageRatings || 0) - (a.user.averageRatings || 0))
          .slice(0, 5);
      }
    const expertWithHighestRating = license.experts.sort((a, b) => b.user.averageRatings - a.user.averageRatings)[0];
      return res.status(200).json({
        status: "success",
        numberOfUserWithLicenses,
        numberOfAllowedUsersWithinLicense,
        unassignedExperts,
        expertWithHighestRating,
        totalDuration, // Total duration of all videos within the corporate
        totalEvaluatedVideos, // Total number of evaluated videos within the corporate
        userDetails, 
        totalExpertRequested ,
        topExperts,
        numberOfSpeechesCreatedThisMonth, // New: number of speeches created this month
        numberOfVideosRecordedThisMonth, // New: number of videos recorded this month
        totalDurationThisMonth, // New: total duration of videos recorded this month
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res
      .status(500)
      .json({ error: "User does not have the required permissions" });
  }
};

const calculateUserSpeechStatistics = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is passed in the request object
    const user = await User.findById(userId)

    const sessions = await PracticeSession.find({
      user: userId,
      deleted: false,
    }).populate("speech");

    const coachingSessions = await CoachingSession.find({ user: userId, deleted: false }).select("duration status createdAt").lean();
    const allSessions = [...sessions, ...coachingSessions];

    const uniqueSpeechesPracticed = new Set(
      sessions.map((session) => session.speech?.id.toString()).filter(Boolean)
    ).size;

    // Number of practice sessions (kept under the historical field name)
    const numberOfVideosRecorded = allSessions.length;

    // Total practice duration in seconds
    const totalDuration = allSessions.reduce(
      (acc, session) => acc + (session.duration || 0),
      0
    );

    const numberOfEvaluations = allSessions.filter(session => session.status === "COMPLETED").length;

    // Fetch the user license to get the credits
    console.log(userId)
    const userLicense = await UserLicense.findOne({
      user: userId,
     // activatedAt: { $ne: null }
      
    }).sort({ activatedAt: -1 }).populate({
      path: 'license',
      populate: {
        path: 'licenseType',
        model: 'LicenseType'
      }
    });;
    console.log(userLicense)

    await userLicense.populate({
      path: 'license',
      populate: {
        path: 'experts.user',
        model: 'User',
      }
    });
    
    let topExperts = [];
    console.log(userLicense.license.experts)
    // Check if experts exist and sort them by averageRatings
    if (userLicense && userLicense.license && userLicense.license.experts) {
      topExperts = userLicense.license.experts
        .sort((a, b) => (b.user.averageRatings || 0) - (a.user.averageRatings || 0))
        .slice(0, 5);
    }
    const now = new Date();

// Calculate the start and end dates for the current month
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

// Retrieve speeches created by the user in the current month
const speechesThisMonth = await Speech.find({
  user: userId,
  createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  deleted: false,
});

const numberOfSpeechesCreatedThisMonth = speechesThisMonth.length;

// Retrieve practice sessions recorded by the user in the current month
const sessionsThisMonth = allSessions.filter(session => session.createdAt >= startOfMonth && session.createdAt <= endOfMonth);

const numberOfVideosRecordedThisMonth = sessionsThisMonth.length;

// Calculate the total duration of sessions recorded this month
const totalDurationThisMonth = sessionsThisMonth.reduce(
  (acc, session) => acc + (session.duration || 0),
  0
);

  


    res.status(200).json({
      status: "success",
      data: {
        uniqueSpeechesPracticed,
        numberOfVideosRecorded,
        totalDuration,
        numberOfEvaluations,
        userLicense,
        topExperts,
        numberOfSpeechesCreatedThisMonth,
        numberOfVideosRecordedThisMonth,
        totalDurationThisMonth
      },
    });
  } catch (error) {
    console.error("Error calculating user speech statistics:", error);
    res.status(500).json({
      status: "error",
      error:
        "Failed to calculate user speech statistics due to an internal server error.",
    });
  }
};
const calculateExpertStatistics = async (req, res) => {
  try {


    
    const userId = req.user.id; // Current user ID (expert)

    // Fetch all videos where `isEvaluated` is true
    const videos = await Video.find({
      isEvaluated: true,
      "coachEvaluationVideos.user": userId, // Only fetch videos where the user is the expert
    });

    // Initialize an object to store the statistics grouped by month
    const monthlyStatistics = {};
    let totalResponseTime = 0;
    let responseCount = 0;

    // Loop over each video and calculate the statistics
    videos.forEach((video) => {
      video.coachEvaluationVideos.forEach((evaluation) => {
        if (evaluation.user.toString() === userId) {
         
          const uploadDate = new Date(evaluation.dateOfUpload);
  
          const monthYear = `${uploadDate.getMonth() + 1}/${uploadDate.getFullYear()}`; // Format as MM/YYYY

          // Initialize the stats for the month if it doesn't exist
          if (!monthlyStatistics[monthYear]) {
            monthlyStatistics[monthYear] = {
              goodRatings: 0,
              badRatings: 0,
              noRatings: 0,
            };
          }

          // Classify the rating
          if (evaluation.ratingByExpert === undefined || evaluation.ratingByExpert === null) {
            // No rating
            monthlyStatistics[monthYear].noRatings += 1;
          } else if (evaluation.ratingByExpert > 3) {
            // Good rating
            monthlyStatistics[monthYear].goodRatings += 1;
          } else {
            // Bad rating
            monthlyStatistics[monthYear].badRatings += 1;
          }
        }
      });
    });



    // Optionally fetch the expert's overall rating details (if stored on the user model)
    const user = await User.findById(userId);
    const averageRating = user.averageRatings || 0;
    const numberOfRatings = user.numberOfRatings || 0;
    const rating = { averageRating, numberOfRatings };
    const averageResponseTime = user.averageResponseTime || 0 ;

    res.status(200).json({
      status: "success",
      data: {
        numberOfReviews: videos.length, // Total number of evaluated videos
        rating,
        averageResponseTime, // Overall average response time
        monthlyStatistics, // Stats grouped by month
      },
    });
  } catch (error) {
    console.error("Error calculating expert statistics:", error);
    res.status(500).json({
      status: "error",
      error: "Failed to calculate expert statistics due to an internal server error.",
    });
  }
};
/*const calculateExpertStatistics = async (req, res) => {
  try {
    // Fetch all users with an expert role
    const experts = await User.find({ role: { $in: ['65b3bda38cecedc07d3becae'] } }); // Replace 'EXPERT_ROLE_ID' with the actual role ID or condition

    const expertStatistics = [];

    // Loop through each expert and calculate their statistics
    for (const expert of experts) {
      const expertId = expert._id;

      // Fetch all videos where the expert has provided evaluations
      const videos = await Video.find({
        isEvaluated: true,
        "coachEvaluationVideos.user": expertId,
      });

      let totalResponseTime = 0;
      let responseCount = 0;
      let numberOfEvaluations = 0;

      videos.forEach((video) => {
        video.coachEvaluationVideos.forEach((evaluation) => {
          if (evaluation.user.toString() === expertId.toString()) {
            const uploadDate = new Date(evaluation.dateOfUpload);
            const requestTime = video.expertAssessmentRequestTime ? new Date(video.expertAssessmentRequestTime) : null;

            // Calculate the response time if both dates are available
            if (requestTime) {
              const responseTime = uploadDate - requestTime;
              totalResponseTime += responseTime;
              responseCount += 1;
            }

            numberOfEvaluations += 1;
          }
        });
      });

      // Calculate the average response time for this expert
      const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : null;

      // Update expert statistics (optional)
      await User.findByIdAndUpdate(expertId, {
        numberOfEvaluationDone: numberOfEvaluations,
        averageResponseTime,
       
      });

      // Add expert statistics to the array for reporting
      expertStatistics.push({
        expertId: expertId,
        numberOfEvaluations,
        numberOfVideos: videos.length,
        averageResponseTime,
      });
    }
console.log(expertStatistics)
    res.status(200).json({
      status: "success",
      data: expertStatistics, // Statistics for all experts
    });
  } catch (error) {
    console.error("Error calculating expert statistics:", error);
    res.status(500).json({
      status: "error",
      error: "Failed to calculate expert statistics due to an internal server error.",
    });
  }
};*/

const userTransactions = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is passed in the request object

   // Find all transactions for the user
   const userJournal = await UserJournal.findOne({
    user: userId,
  });

  if (!userJournal) {
    return res.status(404).json({
      status: "error",
      message: "User journal not found",
    });
  }

  const transactions = userJournal.transactions;

  res.status(200).json({
    status: "success",
    data: transactions,
  });
  } catch (error) {
  
    res.status(500).json({
      status: "error",
      error:
     error.message
    });
  }
};

module.exports = {
  calculateUserSpeechStatistics,
  calculateCorporateSpeechStatistics,
  userTransactions,
  calculateExpertStatistics
};
