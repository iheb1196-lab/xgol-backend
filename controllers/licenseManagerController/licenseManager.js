const UserLicense = require("../../models/userLicense");
const User = require("../../models/user");
const UserJournal = require("../../models/userJournal")
const crypto = require("crypto");
const upgradePlanEmail = require("../../utils/upgradePlan");
const {
  validateAssignLicense,
  validateUpgradeLicense,
} = require("../../validators/assignLicenseValidator");
const {
  hasRequiredDelegatedPermissions,
} = require("../../middleware/permissionUtils");
const License = require("../../models/license");

const assignLicense = async (req, res) => {
  console.log(req.body)
  if (hasRequiredDelegatedPermissions(req.user, "ASSIGN_LICENSE")) {
    const { error } = validateAssignLicense(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try {
      const emailLower = req.body.email.toLowerCase().trim();
      const secret = crypto.randomBytes(8).toString("hex");
      // Check if the license is already assigned to the user
      const existingUserLicense = await UserLicense.findOne({
        licenseEmail: emailLower,
        license: req.body.licenseId,
        activated: true,
      });
      const license = await License.findOne({ _id: req.body.licenseId });
     
    // Check if the license has expired
    const currentDate = new Date();
    if (currentDate >= license.endDate) {
      return res.status(400).json({ error: "License is expired." });
    }
      if (existingUserLicense) {
        return res
          .status(400)
          .json( {error : "User already has this license active." });
      }
   
      const validity = license.validity
      const startDate = new Date( Date.now()); 
      const expiryDate = new Date(startDate);
      expiryDate.setMonth(startDate.getMonth() + validity);
      let userLicenseExpiryDate;
      if (expiryDate > license.endDate) {
        userLicenseExpiryDate = new Date(license.endDate);
      } else {
        userLicenseExpiryDate = expiryDate;
      }
     
      const userLicense = new UserLicense({
     
        license: req.body.licenseId,
        licenseEmail: emailLower,
        credits: license.credits,
        licenseSecret: secret,
        expiryDate: userLicenseExpiryDate,
      });

      await userLicense.save();
      await upgradePlanEmail(secret, emailLower);
     console.log(userLicense)
      res
        .status(201)
        .json({ message: "license assigned successfully", userLicense });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  } else {
    return res
      .status(403)
      .json({ error: "User does not have the required permissions" });
  }
};
const upgradePlan = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "UPGRADE_PLAN")) {
    
    const { error } = validateUpgradeLicense(req.body);
    console.log(error)
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    try {
      const secret = req.body.secret;
      console.log(secret)
      const license = await UserLicense.findOne({ licenseSecret: secret });
      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }
      if (license.activated) {
        return res.status(404).json({ message: "License already activated" });
      }
      const licenseType = await License.findOne({ _id: license.license });

      const userEmails = req.user.emails;

      const foundUser = await User.findOne({
        emails: userEmails,
      });
      await UserLicense.updateMany(
        { user: foundUser._id, activated: true },
        { $set: { activated: false, desactivatedAt: new Date() } }
      );

      if (!foundUser.emails.includes(license.licenseEmail)) {
        foundUser.emails.push(license.licenseEmail);
        await foundUser.save();
      }
      const validity = licenseType.validity
      const startDate = new Date( Date.now()); 
      const expiryDate = new Date(startDate);
      expiryDate.setMonth(startDate.getMonth() + validity);
      const userLicenseExpiryDate = new Date(licenseType.endDate);
    /*  if (expiryDate > license.endDate) {
        userLicenseExpiryDate = new Date(licenseType.endDate);
      } else {
        userLicenseExpiryDate = expiryDate;
      }*/

      license.activated = true;
      license.user = foundUser._id;
      license.activatedAt = new Date();
      license.expiryDate = userLicenseExpiryDate
      await license.save();
         // Step 4: Set the transaction details
    const transaction = {
      type: "CREDITS PURCHASE",
      cost: 0,
      remainingBalance: license ? license.credits : 0,
    };

    // Step 5: Push the transaction into the user's journal
    await UserJournal.findOneAndUpdate(
      { user: foundUser._id },
      { $push: { transactions: transaction } },
      { upsert: true, new: true }
    );

      res
        .status(201)
        .json({ message: "license activated successfully", license });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  } else {
    return res
      .status(500)
      .json({ error: "User does not have the required permissions" });
  }
};
const updateUserLicense = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "UPGRADE_PLAN")) {
    try {
      // Retrieve user licenses where activated is true and populate the license field
      const licenses = await UserLicense.find({ activated: true }).populate('license');

      // Iterate through each license and update the expiry date
      const updatedLicenses = await Promise.all(licenses.map(async (license) => {
        const licenseType = license.license;
        const validity = licenseType.validity;
        
        // Calculate the new expiry date
        const startDate = new Date();
        const expiryDate = new Date(startDate);
        expiryDate.setMonth(startDate.getMonth() + validity);

        let userLicenseExpiryDate;
        if (expiryDate > new Date(licenseType.endDate)) {
          userLicenseExpiryDate = new Date(licenseType.endDate);
        } else {
          userLicenseExpiryDate = expiryDate;
        }

        // Update the user license with the new expiry date
        license.expiryDate = userLicenseExpiryDate;
        await license.save();

        return license;
      }));

      res.status(201).json({ message: "Licenses updated successfully", licenses: updatedLicenses });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(403).json({ error: "User does not have the required permissions" });
  }
};

module.exports = {
  assignLicense,
  upgradePlan,
  updateUserLicense
};
