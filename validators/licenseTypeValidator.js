const Joi = require('joi');

const validateLicenseType = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().label("Name"),
    description: Joi.string().required().label("Description"),
  });
  
  return schema.validate(data);
};


module.exports = {
 validateLicenseType
 
};