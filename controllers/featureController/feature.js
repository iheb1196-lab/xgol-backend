const {
  hasRequiredDelegatedPermissions,
} = require("../../middleware/permissionUtils");
const { featureAccessPermission } = require("../../middleware/featureAccess");

const UserLicense = require("../../models/userLicense");
const Speech = require("../../models/speech");
const FeatureType = require("../../models/featureType");
const UserJournal = require("../../models/userJournal");

/**
 *@const {featureType} ADD_SPEECH
 */
const addSpeech = async (req, res) => {
  if (!hasRequiredDelegatedPermissions(req.user, "ADD_SPEECH")) {
    return res.status(403).json({
      status: "Failed",
      message: "User does not have the required permissions",
    });
  }
  const hasFeatureAccess = await featureAccessPermission(req.user, "ADD_SPEECH");
  if (!hasFeatureAccess) {
    return res.status(403).json({
      status: "Failed",
      message: "Upgrade your license to access this feature",
    });
  }
  try {
    const text = (req.body.text || "").trim();
    if (!text) {
      return res.status(400).json({ error: "Please give me a speech!" });
    }

    const userLicense = await UserLicense.findOne({
      user: req.user.id,
      activated: true,
    });

    const newSpeech = new Speech({
      text,
      title: req.body.title,
      user: req.user.id,
      userLicense: userLicense._id,
    });
    const savedSpeech = await newSpeech.save();

    const featureType = await FeatureType.findOne({ name: "ADD_SPEECH" });
    userLicense.credits -= featureType.credits;
    await userLicense.save();

    await UserJournal.findOneAndUpdate(
      { user: req.user.id },
      {
        $push: {
          transactions: {
            type: "ADD SPEECH",
            cost: featureType.credits,
            remainingBalance: userLicense.credits,
          },
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ status: "Success", speech: savedSpeech });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "Failed", message: error.message });
  }
};

module.exports = {
  addSpeech,
};
