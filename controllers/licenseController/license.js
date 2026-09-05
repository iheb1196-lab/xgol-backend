const License = require("../../models/license");
const User = require("../../models/user")

const { hasRequiredDelegatedPermissions} = require("../../middleware/permissionUtils");

/** this function allows the SUPER ADMIN to create a license  */
const createLicense= async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "CREATE_LICENSE")) {
    try {
      const parseDate = (dateString) => {
        const parts = dateString.split("/");
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; 
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        date.setUTCHours(0, 0, 0, 0);
return date;
      };

      const license = new License({
        ...req.body,
        startDate: parseDate(req.body.startDate),
        endDate: parseDate(req.body.endDate),
      });
      await license.save();
      res
        .status(201)
        .json({ message: "license added successfully", license });
    } catch (error) {
     
      res.status(500).json({ message: error.message });
    }
  } else {
    return res
      .status(500)
      .json({ error: "User does not have the required permissions" });
  }
};

/** this function allows the SUPER ADMIN to fetch the list of the existing licenses */
const getLicenses = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "FETCH_LICENSES")) {
  try {
    
    const licenses = await License.find({});
    res
      .status(201)
      .json({ message: "Licenses fetched successfully", licenses });
  } catch (error) {

    res.status(500).json({ message: error.message });
  } } else {
    return res
    .status(500)
    .json({ error: "User does not have the required permissions" });
  }
};

/** this function allows the SUPER ADMIN to fetch the licenses of a given  corporate */
const getCorporateLicenses = async (req, res) => {

  if (hasRequiredDelegatedPermissions(req.user, "FETCH_CORPORATE_LICENSES")) {
    try {
     
     
      
      const licenses = await License.find({ corporate: req.params.corporate})
                                  

  
      if (licenses.length === 0) {
        return res.status(404).json({ message: "No licenses found for this corporate" });
      }

      res.status(200).json({ message: "Licenses fetched successfully", licenses });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    return res.status(403).json({ error: "User does not have the required permissions" });
  }
};
/** this function allows the  ADMIN to fetch the licenses of a his corporate */
const getCorporateLicensesAdmin = async (req, res) => {

  if (hasRequiredDelegatedPermissions(req.user, "FETCH_CORPORATE_LICENSES")) {
    try {
     
     
      const admin = await User.findOne({_id:req.user.id})
      const corporate = admin.corporate
      const licenses = await License.find({ corporate: corporate})
    
      
  
      if (licenses.length === 0) {
        return res.status(404).json({ message: "No licenses found for this corporate" });
      }

      res.status(200).json({ message: "Licenses fetched successfully", licenses });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    return res.status(403).json({ error: "User does not have the required permissions" });
  }
};





module.exports = {
  createLicense,
  getLicenses,
  getCorporateLicenses,
  getCorporateLicensesAdmin

};