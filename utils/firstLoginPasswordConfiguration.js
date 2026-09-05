const jwt = require('jsonwebtoken'); 
const Token = require('../models/token'); 
const { resetPasswordEmail } = require('../emailTemplates/resetPasswordEmail'); 
const sendEmail = require('./sendEmail')
const dotenv = require("dotenv");
dotenv.config();

async function resetPassword(user, email,license) {

  await Token.deleteMany({ user: user._id });

  
  const resetPasswordToken = jwt.sign(
    { userId: user._id , licenseId:license._id},
    process.env.JWTPRIVATEKEY,

  );


  let token = new Token({
    value: resetPasswordToken,
    user: user._id
  });

  
  const url = `${process.env.FRONT_URL}/account_verification/passwordReset/${token._id}`;


  await sendEmail(email, "Password Reset", resetPasswordEmail(url));

 
  await token.save();
}

module.exports = resetPassword;
