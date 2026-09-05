const jwt = require('jsonwebtoken'); 
const Token = require('../models/token'); 
const {upgradePlan }= require('../emailTemplates/upgradePlan');
const sendEmail = require('./sendEmail')

async function handleResetPassword(secret, email) {
  


  await sendEmail(email, "Your Corporate Plan License is Ready!", upgradePlan(email,secret));

 

}

module.exports = handleResetPassword;