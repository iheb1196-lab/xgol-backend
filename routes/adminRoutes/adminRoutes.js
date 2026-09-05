const express = require("express");
const adminController = require("../../controllers/adminController/admin");

const router = express.Router();
const auth = require("../../middleware/auth");
router.get("/admin/unassignedExperts/:licenseId", auth, adminController.getUnassignedExperts);
module.exports = router;