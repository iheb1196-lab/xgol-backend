const Permission = require("../../models/permission");
const {
  validatePermission,
} = require("../../validators/permissionValidator.js");
const {
  hasRequiredDelegatedPermissions,
} = require("../../middleware/permissionUtils");

// Function to create a permission
const createPermission = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "CREATE_PERMISSION")) {
    const { error } = validatePermission(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    try {
      const permission = new Permission({
        ...req.body,
      });
      await permission.save();
      res
        .status(201)
        .json({ message: "Permission added successfully", permission });
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
const getPermissions = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "FETCH_PERMISSIONS")) {
    
    try {
      console.log(req.user);
      const permissions = await Permission.find({});
      res
        .status(201)
        .json({ message: "Permissions fetched successfully", permissions });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    return res
      .status(500)
      .json({ error: "User does not have the required permissions" });
  }
};

module.exports = {
  createPermission,
  getPermissions,
};
