const User = require("../../models/user");
const Role = require("../../models/role");
const UserJournal = require("../../models/userJournal")
const {validateUserSignupByAdmin, validateAddAdmin , validateClientSignUp,validateExpertSignupByAdmin } = require("../../validators/userValidator.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const handleResetPassword = require('../../utils/firstLoginPasswordConfiguration.js')
const handleVerifyAccount = require('../../utils/verifyAccount.js')
const {
  hasRequiredDelegatedPermissions,
} = require("../../middleware/permissionUtils");
const UserLicense = require("../../models/userLicense");
const License = require("../../models/license");
const Token = require("../../models/token");

const addSuperAdmin = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "ADD_SUPER_ADMIN")) {
  try {
    const { error } = validateUserSignupByAdmin(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const emailLower = req.body.email.toLowerCase().trim();
    const superAdminRole = await Role.findOne({name : "SUPER_ADMIN"})
     const clientRole = await Role.findOne({name : "CLIENT"})
    
  
      const user = await User.findOne({  'emails.0': emailLower});
      if (user) {
        if (!user.verified) {
            const userLicense = await UserLicense.findOne({user:user._id})
          await handleResetPassword(user, emailLower,userLicense)
     
          return res.status(400).json({
            message: "A verification email has been sent to your account.",
          });
        } else {
         
          return res
            .status(409)
            .json({ message: "User with given email already exists!" });
        }
      }
    const username = `${req.body.firstName} ${req.body.lastName}`;
    const newUser = await new User({
      ...req.body,
      emails: [emailLower], 
      userName: username,
     role: [clientRole._id,superAdminRole._id],
    });
    await newUser.save();
    /** Assign to the new user the freemium licence  */
    const license =await License.findOne({_id:"65b799b92267c99026b2fa75"})
    const validity = license.validity
    const startDate = new Date( Date.now()); 
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(startDate.getMonth() + validity);
    const userLicense = await new UserLicense({
      license:license._id,
      assignedAt: new Date(),
      licenseEmail : emailLower,
      credits : license.credits,
      user:newUser._id,
      expiryDate:expiryDate,
     
     
    });
    await userLicense.save();
   

    await handleResetPassword(newUser, emailLower,userLicense);
  
    res.status(201).json({ message: "Singup success" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  } 
}else {
  return res
  .status(500)
  .json({ error: "User does not have the required permissions" });
}
};


const addAdmin = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "ADD_ADMIN")) {
  try {
    const { error } = validateAddAdmin(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const emailLower = req.body.email.toLowerCase().trim();
    const clientRole = await Role.findOne({name : "CLIENT"})
    const adminRole = await Role.findOne({name : "ADMIN"})

   
      const user = await User.findOne({  'emails.0': emailLower});
      if (user) {
        if (!user.verified) {
            const userLicense = await UserLicense.findOne({user:user._id})
            await handleResetPassword(user, emailLower,userLicense)
        
          return res.status(400).json({
            message: "A verification email has been sent to your account.",
          });
        } else {
          
          return res
            .status(409)
            .json({ message: "User with given email already exists!" });
        }
      }
   
  
    
    const username = `${req.body.firstName} ${req.body.lastName}`;
   
    const newUser = await new User({
      ...req.body,
      emails: [emailLower], 
      userName: username,
      role: [clientRole._id,adminRole._id],
    });
    await newUser.save();
      /** Assign to the new user the freemium licence  */
      const license =await License.findOne({_id:"65b799b92267c99026b2fa75"})
      const validity = license.validity
      const startDate = new Date( Date.now()); 
      const expiryDate = new Date(startDate);
      expiryDate.setMonth(startDate.getMonth() + validity);
      const userLicense = await new UserLicense({
        license:license._id,
        assignedAt: new Date(),
        licenseEmail : emailLower,
        credits : license.credits,
        user:newUser._id,
        expiryDate:expiryDate,
       
       
      });
      await userLicense.save();
 
      
  
      await handleResetPassword(newUser, emailLower,userLicense);

   
    
    res.status(201).json({ message: "Singup success" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  } 
}else {
  return res
  .status(500)
  .json({ error: "User does not have the required permissions" });
}
};

const addExpert = async (req, res) => {
  if (hasRequiredDelegatedPermissions(req.user, "ADD_EXPERT")) {
    try {
      const { error } = validateExpertSignupByAdmin(req.body);

      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const emailLower = req.body.email.toLowerCase().trim();
      const expertRole = await Role.findOne({ name: "EXPERT" });
      const clientRole = await Role.findOne({ name: "CLIENT" });

      const user = await User.findOne({ 'emails.0': emailLower });
      if (user) {
        // User exists but not verified, handle the case of adding expert role
        if (!user.verified) {
          if (!user.role.includes(expertRole._id)) {
            user.role.push(expertRole._id); // Add expert role if not already assigned
            await user.save();
          }
          if (req.body.licenseId) {
            const licenseCorporate = await License.findById(req.body.licenseId);
            if (!licenseCorporate) {
              return res.status(404).json({ message: "License not found." });
            }

            // Check if the expert (user) is already in the license's experts array
            const isExpertInLicense = licenseCorporate.experts.some(
              (expert) => expert.user.toString() === user._id.toString()
            );

            if (!isExpertInLicense) {
              // Push an object containing user, maxEvaluations, and remainingEvaluations
              licenseCorporate.experts.push({
                user: user._id,
                maxEvaluations: req.body.maxEvaluation,
                remainingEvaluations: req.body.maxEvaluation,
              });
              await licenseCorporate.save();
            }
          }

          const userLicense = await UserLicense.findOne({ user: user._id });
          await handleResetPassword(user, emailLower, userLicense);

          return res.status(200).json({
            message: "User successfully added to your list of experts. A verification email has been sent to their account to activate it.",
          });
        } else {
          // User exists and is verified
          if (!user.role.includes(expertRole._id)) {
            user.role.push(expertRole._id); // Add expert role if not already assigned
            await user.save();
          }

          if (req.body.licenseId) {
            const licenseCorporate = await License.findById(req.body.licenseId);
            if (!licenseCorporate) {
              return res.status(404).json({ message: "License not found." });
            }

            // Check if the expert (user) is already in the license's experts array
            const isExpertInLicense = licenseCorporate.experts.some(
              (expert) => expert.user.toString() === user._id.toString()
            );

            if (!isExpertInLicense) {
              licenseCorporate.experts.push({
                user: user._id,
                maxEvaluations: req.body.maxEvaluation,
                remainingEvaluations: req.body.maxEvaluation,
              });
              await licenseCorporate.save();
            }
          }

          return res.status(200).json({
            message: "User successfully added to your list of experts.",
          });
        }
      }

      // Create a new expert if the user does not exist
      const username = `${req.body.firstName} ${req.body.lastName}`;
      const newUser = new User({
        ...req.body,
        emails: [emailLower],
        userName: username,
        role: [clientRole._id, expertRole._id],
      });
      await newUser.save();

      // Case 1: If `licenseId` is provided in request
      if (req.body.licenseId) {
        const licenseCorporate = await License.findById(req.body.licenseId);
        if (!licenseCorporate) {
          return res.status(404).json({ message: "License not found." });
        }

        // Add the new expert to the experts array
        licenseCorporate.experts.push({
          user: newUser._id,
          maxEvaluations: req.body.maxEvaluation,
          remainingEvaluations: req.body.maxEvaluation,
        });
        await licenseCorporate.save();
      }

      // Set license validity and expiry for the new user
      const license = await License.findOne({ _id: "65b799b92267c99026b2fa75" });
      const validity = license ? license.validity : 0;
      const startDate = new Date(Date.now());
      const expiryDate = new Date(startDate);
      expiryDate.setMonth(startDate.getMonth() + validity);

      const userLicense = new UserLicense({
        license: license._id,
        assignedAt: new Date(),
        licenseEmail: emailLower,
        credits: license.credits,
        user: newUser._id,
        expiryDate: expiryDate,
      });
      await userLicense.save();

      // Handle sending password reset email
      await handleResetPassword(newUser, emailLower, userLicense);

      return res.status(201).json({ message: "User successfully added to your list of experts. A verification email has been sent to their account to activate it." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    return res.status(403).json({ error: "User does not have the required permissions." });
  }
};



const clientSignUp = async (req, res) => {
  
  try {
   const { error } = validateClientSignUp(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const emailLower = req.body.email.toLowerCase().trim();
    const clientRole = await Role.findOne({ name: "CLIENT" });
    if (!clientRole) {
      console.error(
        'Client signup is unavailable because the "CLIENT" role is missing. Run "npm run seed:local".'
      );
      return res.status(503).json({
        message: "Client signup is temporarily unavailable.",
      });
    }
   
 
   
      let user = await  User.findOne({
        'emails.0': emailLower,
      })
      if (user) {
        if (!user.verified) {
        
          
          const userLicense = await UserLicense.findOne({user:user._id})
          await handleVerifyAccount(user, emailLower,userLicense)
        
          return res.status(201).json({
            message: "A verification email has been sent to your account.",
          });
        } else {
          // User exists and is verified
          return res
            .status(409)
            .json({ message: "User with given email already exists!" });
        }
      }
   
  
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashPassword = await bcrypt.hash(req.body.password, salt);
    const username = `${req.body.firstName} ${req.body.lastName}`;
   
    const license = await License.findById("65b799b92267c99026b2fa75");
    if (!license) {
      console.error(
        'Client signup is unavailable because the freemium license is missing. Run "npm run seed:local".'
      );
      return res.status(503).json({
        message: "Client signup is temporarily unavailable.",
      });
    }

    const newUser = new User({
      ...req.body,
      emails: [emailLower], 
      userName: username,
      role: [clientRole._id],
      password:hashPassword,
   
    });
   
   
    await newUser.save();
    /** Assign to the new user the freemium licence  */
    const validity = license.validity
    const startDate = new Date( Date.now()); 
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(startDate.getMonth() + validity);
    const userLicense = await new UserLicense({
      license:license._id,
      assignedAt: new Date(),
      licenseEmail : emailLower,
      credits:license.credits,
      user:newUser._id,
      expiryDate:expiryDate,
     
     
    });
    await userLicense.save();

    await handleVerifyAccount(newUser, emailLower,userLicense)
    res.status(201).json({ message: "A verification email has been sent to your account." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  } 

};
const accountVerification = async (req, res) => {
    try {
      const tokenId = req.params.token;
      if (!tokenId) {
        return res.status(401).json({ message: "No token provided. Unauthorized" });
      }
  
      const token = await Token.findOne({ _id: tokenId });
      if (!token) {
        return res.status(401).json({ message: "Invalid or expired token." });
      }
  
      let tokenDecoded;
      try {
        tokenDecoded = jwt.verify(token.value, process.env.JWTPRIVATEKEY);
      } catch (err) {
        return res.status(403).json({ message: "Failed to verify token." });
      }
  
      const user = await User.findOne({ _id: tokenDecoded.userId });
      if (!user) {
        return res.status(404).json({ message: "User does not exist" });
      }
  
      
  
      const userLicense = await UserLicense.findOne({ _id: tokenDecoded.licenseId });
      let userJournal = await UserJournal.findOne({user:tokenDecoded.userId})
      console.log(userJournal)
      if (!userLicense) {
        return res.status(404).json({ message: "License does not exist" });
      }
      await User.updateOne({ _id: user._id }, { $set: { verified: true } });
      userLicense.activated = true;
      userLicense.activatedAt = new Date();
  
      await userLicense.save();
      if (!userJournal) {
        userJournal = new UserJournal({ user: tokenDecoded.userId, transactions: [] });
      }
      
  
      
      userJournal.transactions.push({
        type: "CREDITS PURCHASE",
        cost: 0, 
        remainingBalance: userLicense.credits,
      });
  
      await userJournal.save();
      await Token.deleteOne({ _id: token._id });
  
      res.status(200).json({ message: "Your account is verified successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
module.exports = {
    addSuperAdmin,
    addAdmin,
    addExpert,
    clientSignUp,
    accountVerification
    
  };
