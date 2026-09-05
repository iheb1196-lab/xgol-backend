const express = require('express');
const controllers = require("../../controllers/errorController/error");
const router = express.Router();




router.get('/error' , controllers.getErrors);

module.exports= router;