const Joi = require('joi');

const validateAssignLicense = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("Email"),
    licenseId: Joi.string().required().label("License")
  });
  
  return schema.validate(data);
};
const validateUpgradeLicense = (data) => {
    const schema = Joi.object({

      secret: Joi.string().required().label("Secret")
    });
    
    return schema.validate(data);
  };


module.exports = {
    validateAssignLicense,
    validateUpgradeLicense
 
};