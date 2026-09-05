const UserLicense = require("../../models/userLicense");

const { hasRequiredDelegatedPermissions} = require("../../middleware/permissionUtils");
/** this function allows client to fetch his active license informatio  */
const getActiveLicenseInformation = async (req, res) => {

    if (hasRequiredDelegatedPermissions(req.user, "FETCH_ACTIVE_LICENSES_INFORMATION")) {
      try {
       
       
     
        const userLicense = await UserLicense.findOne({
          user: req.user.id,
          activatedAt: { $ne: null }
        })
          .sort({ activatedAt: -1 })
          .populate({
            path: 'license',
            populate: {
              path: 'licenseType',
              model: 'LicenseType'
            }
          });
                    
       console.log(userLicense)
  
        res.status(200).json({ message: "Licenses fetched successfully", userLicense });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    } else {
      return res.status(403).json({ error: "User does not have the required permissions" });
    }
  };
  /** this function allows admin to fetch all the user belonging to a given license of his corporate  */
const getCorporateLicenseUsers = async (req, res) => {

  if (hasRequiredDelegatedPermissions(req.user, "FETCH_CORPORATE_LICENSES")) {
    try {
     
    
   
      const userLicenses = await userLicense.find({
          license: req.params.license,
          
      }).populate('license');
                                  
      
  
      if (userLicenses.length === 0) {
        return res.status(404).json({ message: "No active license found" });
      }

      res.status(200).json({ message: "Licenses fetched successfully", userLicenses });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    return res.status(403).json({ error: "User does not have the required permissions" });
  }
};
  module.exports = {
    getActiveLicenseInformation,
    getCorporateLicenseUsers
  
  };