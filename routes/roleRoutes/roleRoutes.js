const express = require('express');
const controllers = require("../../controllers/roleController/role");
const router = express.Router();
const auth= require ("../../middleware/auth")



router.post('/role', controllers.createRole);
router.get('/role',auth, controllers.getRoles);


module.exports= router;