
const UserLicense = require("../../models/userLicense");
const License = require("../../models/license");
const Token = require("../../models/token");
const User = require("../../models/user");
const Error = require("../../models/error")
const jwt = require("jsonwebtoken");
const getUserEmail = async(req,res) => {

	try {
    const tokenId  = req.params.token;
    const token = await Token.findOne({_id:tokenId})
    
    if (!token) {
     
      return res.status(401).json({ message: "No token provided. Unauthorized" });
    }
 
    const tokenDecoded = jwt.verify(token.value, process.env.JWTPRIVATEKEY);
    console.log(tokenDecoded)

		const user = await User.findOne({ _id: tokenDecoded.userId });
		if (!user) return res.status(400).json({ message: "User does not exist" });
    const email = user.emails[0]
  

		res.status(200).json({email });
	} catch (err) {
	
   console.log(err)
      res.status(500).json({ error: "internal server error" });
    
	}
  
};
const getUserCredits = async (req, res) => {
  try {
   
    const userLicense = await UserLicense.findOne({
      user: req.user.id,
      activated: true,
    })
      .populate({
        path: 'license', // Populate the license field
        populate: {
          path: 'experts.user', // Then, populate the experts field within the license
          model: 'User', // Reference to the User model for experts
        },
      });
     

    if (!userLicense) {
      return res.status(200).json({ status: "success", credits: 0, message: "No active license found",active : false });
    }

    // Filter the experts with remainingEvaluations greater than 0
    const availableExperts = userLicense.license.experts.filter(
      (expert) => expert.remainingEvaluations > 0
    );
    const exists = !!userLicense.snackCoachingExpert;


    return res.status(200).json({ status: "success", credits: userLicense.credits , experts: availableExperts , active: true , exists:exists});

  } catch (err) {

       const failure = new Error({
              user: req.user? req.user.id:null,
              operation: "Get User Credits",
              description: err.message,
            });
            
           await failure.save();
    res.status(500).json({ error: "internal server error" });
  }
};
const assignSnackCoachingExpert = async (req, res) => {
  try {


const expertId = req.body.expertId
    // Find the user license that is activated for the logged-in user
    const userLicense = await UserLicense.findOneAndUpdate(
      { user: req.user.id, activated: true },
      { snackCoachingExpert: expertId }, // Update the snackCoachingExpert field with expertId
      { new: true } // Return the updated document
    );
    await License.updateOne(
      {
        _id: userLicense.license,         // The ID of the license document
        "experts.user": expertId        // Ensures the expert exists within the experts array
      },
      {
        $inc: { "experts.$[matchedExpert].remainingEvaluations": -1 } // Decrement remainingEvaluations by 1
      },
      {
        arrayFilters: [{ "matchedExpert.user": expertId }] // Matches the specific expert by user ID
      }
    );
  
    if (!userLicense) {
      return res.status(404).json({
        status: "error",
        message: "Active license not found for this user.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Snack coaching expert updated successfully",
      userLicense,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "internal server error" });
  }
};

module.exports = {
  getUserCredits,
  getUserEmail,
  assignSnackCoachingExpert
};

