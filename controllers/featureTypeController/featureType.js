const FeatureType = require("../../models/featureType");

const {
  hasRequiredDelegatedPermissions,
} = require("../../middleware/permissionUtils");

// Function to create a  feature type
const createFeatureType = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "CREATE_FEATURE_TYPE")) {
 

    try {
      const type = new FeatureType({
        ...req.body,
      });
      await type.save();
      res
        .status(201)
        .json({ message: "Type added successfully", type });
    } catch (error) {
        console.log(error)
      res.status(500).json({ message: error.message });
    }
  } else {
    return res
      .status(500)
      .json({ error: "User does not have the required permissions" });
  }
};


const getFeatureTypes = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "FETCH_FEATURE_TYPES")) {
  try {
    console.log(req.user);
    const featureTypes = await FeatureType.find({});
    res
      .status(201)
      .json({ message: "Feature Types fetched successfully", featureTypes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } }else {
    return res
    .status(500)
    .json({ error: "User does not have the required permissions" });
  }
};

module.exports = {
getFeatureTypes,
createFeatureType
};