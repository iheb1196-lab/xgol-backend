// userValidator.js
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const complexityOptions = {
  min: 10,
  max: 30,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  requirementCount: 2,
};

const validateUserSignup = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required().label("First Name"),
    lastName: Joi.string().required().label("Last Name"),

    email: Joi.string().email().required().label("Email"),

    password: passwordComplexity(complexityOptions)
      .required()
      .label("Password"),
  });
  return schema.validate(data);
};
const validateAddAdmin = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required().label("First Name"),
    lastName: Joi.string().required().label("Last Name"),

    email: Joi.string().email().required().label("Email"),
    corporate:Joi.string().required().label("Corporate"),
  })
  return schema.validate(data);
};
const validateResetPassword = (data) => {
  const schema = Joi.object({


    email: Joi.string().email().required().label("Email"),
   
  })
  return schema.validate(data);
};
const validateUserSignupByAdmin = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required().label("First Name"),
    lastName: Joi.string().required().label("Last Name"),
    email: Joi.string().email().required().label("Email"),
  });
  return schema.validate(data);
};
const validateExpertSignupByAdmin = (data) => {
  const schema = Joi.object({
   
    email: Joi.string().email().required().label("Email"),
    licenseId: Joi.string().optional().label("License"),
    firstName: Joi.string().required().label("First Name"),
    lastName: Joi.string().required().label("Last Name"),
    maxEvaluation: Joi.number().required().label("Max Evaluation"),
  });
  return schema.validate(data);
};
const validateClientSignUp = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required().label("First Name"),
    lastName: Joi.string().required().label("Last Name"),
    email: Joi.string().email().required().label("Email"),
    password: passwordComplexity(complexityOptions)
    .required()
    .label("Password"),


  });
  return schema.validate(data);
};
const validateLogin = (data) => {
  const schema = Joi.object({
    // Login must accept existing local-development accounts such as
    // demo@xgol.local. New account validation can remain stricter.
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .label("Email"),
    password: Joi.string().required().label("Password"),
  });
  return schema.validate(data);
};
const validatePassword = (data) => {
  const schema = Joi.object({
    password: passwordComplexity(complexityOptions)
      .required()
      .label("Password"),
  });
  return schema.validate(data);
};

module.exports = {
  validateUserSignup,
  validateLogin,
  validateUserSignupByAdmin,
  validatePassword,
  validateAddAdmin,
  validateClientSignUp,
  validateResetPassword,
  validateExpertSignupByAdmin
};
