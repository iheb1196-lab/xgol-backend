
const Error = require("../../models/error");
const UserLicense = require("../../models/userLicense")
const Video = require("../../models/video")
const User = require("../../models/user")


const getErrors = async (req, res) => {

    try {
      
      const errors = await Error.find({});
     const userLicenses = await UserLicense.find({})
    // const errors = await Video.find({}).populate('user')
   
      res
        .status(201)
        .json({ message: "Errors fetched successfully", errors});
    } catch (error) {
  
      res.status(500).json({ message: error.message });
    } 
  };
  module.exports = {

    getErrors,
  
  
  };