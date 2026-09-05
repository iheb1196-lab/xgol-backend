const UserLicense = require("../models/userLicense");
const FeatureType = require("../models/featureType"); // Assuming this is the correct path

/**
 * Middleware to check user's permission to access a specific feature.
 * @param {Object} accessTokenPayload: Parsed access token payload containing the user's ID
 * @param {String} requiredFeatureName: The name of the feature to check access for
 * @returns {Promise<boolean>} Whether the user has access to the required feature
 */
const featureAccessPermission = async (
  accessTokenPayload,
  requiredFeatureName
) => {
  try {
    // Find the active license for the user
    const activatedLicense = await UserLicense.findOne({
      user: accessTokenPayload.id,
      activated: true,
    })


    if (!activatedLicense) {
      return false;
    }

    // Check if the license has expired
    const expiryDate = new Date(activatedLicense.expiryDate); // Assuming expiryDate is a Date object
    if (new Date() > expiryDate) {
      // Optionally update the license to mark it as deactivated
  
      activatedLicense.activated = false;
      activatedLicense.desactivatedAt = new Date();
      await activatedLicense.save();
      return false;
    }

    // Find the required feature in the license features
    const requiredFeature = await FeatureType.findOne({
      name: requiredFeatureName,
    });
    if (!requiredFeature) {
      return false; // Feature type not found
    }
    // Check if the user has enough credits to access the feature
    if (activatedLicense.credits < requiredFeature.credits) {
      console.log("Insufficient credits for accessing the feature.");
      return false;
    }


    return true;
  } catch (error) {
    console.error("Error checking feature access permission:", error);
    throw error; 
  }
};

module.exports = {
  featureAccessPermission,
};
