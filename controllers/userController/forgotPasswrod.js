const User = require("../../models/user");
const Token = require("../../models/token");
const {validatePassword,validateResetPassword } = require("../../validators/userValidator.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const handleResetPassword = require('../../utils/resetPassword.js')
const UserLicense = require("../../models/userLicense");


const forgotPassword = async (req, res) => {
  console.log(req.body)
 
    try {
      const { error } = validateResetPassword(req.body);
  
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
  
      const emailLower = req.body.email.toLowerCase().trim();
      
    
        const user = await User.findOne({ 'emails.0': emailLower });
        if (!user) {
         
            return res.status(404).json({
              message: "User does not exist",
            });
          
        }
      await handleResetPassword(user, emailLower);
  
      res.status(201).json({ message: "Reset Password Success" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    } 
  
  };
  
  const firstLoginPasswordConfiguration = async(req,res) => {

	try {
    const tokenId  = req.params.token;
    const token = await Token.findOne({_id:tokenId})
    
    if (!token) {
     
      return res.status(401).json({ message: "No token provided. Unauthorized" });
    }
    const { error } = validatePassword(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const tokenDecoded = jwt.verify(token.value, process.env.JWTPRIVATEKEY);
     console.log(tokenDecoded)
		const user = await User.findOne({ _id: tokenDecoded.userId });
		if (!user) return res.status(400).json({ message: "User does not exist" });

		const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashPassword = await bcrypt.hash(req.body.password, salt);

		await User.updateOne({ _id: user._id}, { $set: { verified: true, password: hashPassword }});
        const userLicense = await UserLicense.findOne({_id:tokenDecoded.licenseId})
		
        userLicense.activated = true;
       
        userLicense.activatedAt = new Date(); 
       
        await userLicense.save();

        
    await Token.deleteOne({ _id: token._id });
		res.status(200).json({ message: "Password reset successfully" });
	} catch (err) {
	
    if (err.name === "TokenExpiredError") {
      res.status(401).json({ message: "Token expired. Please log in again" });
    } else {
      console.error(err);
      res.status(401).json({ message: "Invalid token. Unauthorized" });
    }
	
	}

};

  const resetPassword = async(req,res) => {

	try {
    const tokenId  = req.params.token;
    const token = await Token.findOne({_id:tokenId})
    
    if (!token) {
     
      return res.status(401).json({ message: "No token provided. Unauthorized" });
    }
    const { error } = validatePassword(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
  
    try {
        tokenDecoded = jwt.verify(token.value, process.env.JWTPRIVATEKEY);
      } catch (err) {
        return res.status(403).json({ message: "Failed to verify token." });
      }
  
		const user = await User.findOne({ _id: tokenDecoded.userId });
		if (!user) return res.status(404).json({ message: "User does not exist" });

		const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashPassword = await bcrypt.hash(req.body.password, salt);

		await User.updateOne({ _id: user._id}, { $set: { verified: true, password: hashPassword }});;
        
    await Token.deleteOne({ _id: token._id });
		res.status(200).json({ message: "Password reset successfully" });
	} catch (err) {
	
 
      res.status(500).json({ message: "Internal server error" });
    }
	
	

};
module.exports = {
    resetPassword,
    forgotPassword,
    firstLoginPasswordConfiguration 
  };