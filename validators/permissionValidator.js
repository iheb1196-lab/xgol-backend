const Joi = require('joi');

const validatePermission = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().label("Name"),
    description: Joi.string().required().label("Description"),
  });
  
  return schema.validate(data);
};


module.exports = {
  validatePermission
 
};