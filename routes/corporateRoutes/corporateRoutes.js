const express = require('express');
const controllers = require("../../controllers/corporateController/corporate");
const router = express.Router();
const auth= require ("../../middleware/auth")


router.post('/corporate',auth,controllers.createCorporate);
router.get('/corporate',auth , controllers.getCorporates);

module.exports= router;