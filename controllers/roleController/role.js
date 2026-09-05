const Role = require("../../models/role");
const Permission = require("../../models/permission");

const { validateRole } = require("../../validators/roleValidator.js");
const { hasRequiredDelegatedPermissions,} = require("../../middleware/permissionUtils");


const createRole = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "CREATE_ROLE")) {
    const { error } = validateRole(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    try {
      const permissions = await Permission.find({
        name: { $in: req.body.permissions },
      });
      const permissionIds = permissions.map((permission) => permission._id);
      const role = new Role({
        ...req.body,
        permissions: permissionIds,
      });
      await role.save();
      res.status(201).json({ message: "Permission added successfully", role });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    return res
      .status(500)
      .json({ error: "User does not have the required permissions" });
  }
};


const getRoles = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "FETCH_ROLES")) {
    try {

  
       
 
  
      const roles = await Role.find({}).populate("permissions");
  
      res.status(201).json({ message: "roles fetched successfully", results });
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
  createRole,
  getRoles,
};
