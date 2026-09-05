const Joi = require('joi');

const validateRole = (data) => {
  const schema = Joi.object({
  
    permissions: Joi.array().required().label("Permission"),
    
    description: Joi.string().required().label("Description"),
    name: Joi.string().required().label("Name"),
   

  });
  
  return schema.validate(data);
};


module.exports = {
  validateRole
 
};