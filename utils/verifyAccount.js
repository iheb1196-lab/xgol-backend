const jwt = require('jsonwebtoken'); 
const Token = require('../models/token'); 
const { emailConfirmation } = require('../emailTemplates/emailConfirmation'); 
const sendEmail = require('./sendEmail')
const dotenv = require("dotenv");
dotenv.config();


async function handleVerifyAccount(user, email,license) {
 
  
  await Token.deleteMany({ user: user._id });

  
  const resetPasswordToken = jwt.sign(
    { userId: user._id , licenseId:license._id},
    process.env.JWTPRIVATEKEY,

  );
 


  let token = new Token({
    value: resetPasswordToken,
    user: user._id
  });
 
  

  const url = `${process.env.FRONT_URL}/account_verification/${token._id}`;
  const username = user.userName

  await sendEmail(email, "Activate Your XGOL Account Now!", emailConfirmation(url,username));

 
  await token.save();
}

module.exports = handleVerifyAccount;