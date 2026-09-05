const express = require('express');
const controllers = require("../../controllers/permissionController/permission");
const router = express.Router();
const auth= require ("../../middleware/auth")


router.post('/permission',auth,controllers.createPermission);
router.get('/permission',auth , controllers.getPermissions);


module.exports= router;