const LicenseType = require("../../models/licenseType");
const { validateLicenseType } = require("../../validators/licenseTypeValidator");
const {
  hasRequiredDelegatedPermissions,
} = require("../../middleware/permissionUtils");

// Function to create a permission
const createLicenseType = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "CREATE_LICENSE_TYPE")) {
    const { error } = validateLicenseType(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    try {
      const type = new LicenseType({
        ...req.body,
      });
      await type.save();
      res
        .status(201)
        .json({ message: "Type added successfully", type });
    } catch (error) {
     
      res.status(500).json({ message: error.message });
    }
  } else {
    return res
      .status(500)
      .json({ error: "User does not have the required permissions" });
  }
};

// Function to get all permissions
const getLicenseTypes = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "FETCH_LICENSE_TYPES")) {
  try {
    console.log(req.user);
    const licenseTypes = await LicenseType.find({});
    res
      .status(201)
      .json({ message: "License Types fetched successfully", licenseTypes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }} else {
    return res
    .status(500)
    .json({ error: "User does not have the required permissions" });
  }
};

module.exports = {
getLicenseTypes,
createLicenseType
};