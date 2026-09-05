const User = require("../../models/user");
const Video = require("../../models/video");
const Role = require("../../models/role");
const License = require("../../models/license"); // Assuming you have the License model defined
const {
    hasRequiredDelegatedPermissions,
  } = require("../../middleware/permissionUtils");


const getUnassignedExperts = async (req, res) => {
  if (!hasRequiredDelegatedPermissions(req.user, "ADD_EXPERT")) {
    return res.status(403).json({ error: "User does not have the required permissions." });
  }

  try {

 
    const expertRole = await Role.findOne({ name: "EXPERT" });



    // Get all users with the EXPERT role
    const experts = await User.find({ role: expertRole._id });

await Promise.all(
  experts.map(async (expert) => {
    const expertId = expert._id;

    // Fetch videos where this expert did an evaluation
    const videos = await Video.aggregate([
      {
        $unwind: "$coachEvaluationVideos" // Unwind the array to process each evaluation
      },
      {
        $match: {
          "coachEvaluationVideos.user": expertId, // Match videos where this expert did an evaluation
          "coachEvaluationVideos.ratingByExpert": { $ne: null } // Only consider those with expert ratings
        }
      },
      {
        $group: {
          _id: "$coachEvaluationVideos.user", // Group by expert ID
          averageRating: { $avg: "$coachEvaluationVideos.ratingByExpert" }, // Calculate average rating
          numberOfUserRatings: { $sum: 1 } // Count number of evaluations
        }
      }
    ]);

    // Step 3: If ratings found, update the expert's averageRatings and numberOfRatings
    if (videos.length > 0) {
      const { averageRating, numberOfUserRatings } = videos[0];

      // Update the expert's document with the new average and number of ratings
      await User.updateOne(
        { _id: expertId },
        {
          $set: {
            averageRatings: averageRating,
            numberOfRatings: numberOfUserRatings,
          }
        }
      );
    } else {
      // If no ratings, reset to 0
      await User.updateOne(
        { _id: expertId },
        {
          $set: {
            averageRatings: 0,
            numberOfRatings: 0,
          }
        }
      );
    }
  })
);

console.log("Expert ratings updated successfully!");


  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



module.exports = { getUnassignedExperts };
