const express = require('express');
const controllers = require("../../controllers/licenseTypeController/licenseType");
const router = express.Router();
const auth= require ("../../middleware/auth")


router.post('/licenseType',auth,controllers.createLicenseType);
router.get('/licenseType',auth , controllers.getLicenseTypes);

module.exports= router;