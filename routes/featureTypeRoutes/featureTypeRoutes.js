const express = require('express');
const controllers = require("../../controllers/featureTypeController/featureType");
const router = express.Router();
const auth= require ("../../middleware/auth")


router.post('/featureType',auth,controllers.createFeatureType);
router.get('/featureType',auth , controllers.getFeatureTypes);

module.exports= router;