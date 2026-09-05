const jwt = require('jsonwebtoken'); 
const Token = require('../models/token'); 
const { resetPasswordEmail } = require('../emailTemplates/resetPasswordEmail'); 
const sendEmail = require('./sendEmail')
const dotenv = require("dotenv");
dotenv.config();

async function handleResetPassword(user, email) {
  console.log(user)
  await Token.deleteMany({ user: user._id });

  
  const resetPasswordToken = jwt.sign(
    { userId: user._id },
    process.env.JWTPRIVATEKEY,
    { expiresIn: "7d" }
  );


  let token = new Token({
    value: resetPasswordToken,
    user: user._id
  });

  

  const url = `${process.env.FRONT_URL}/set_password/${token._id}`;



  await sendEmail(email, "Password Reset", resetPasswordEmail(url));

 
  await token.save();
}

module.exports = handleResetPassword;
