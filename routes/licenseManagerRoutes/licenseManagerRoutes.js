const express = require('express');
const controllers = require("../../controllers/licenseManagerController/licenseManager");
const router = express.Router();
const auth= require ("../../middleware/auth")

/**
 * @openapi
 * /api/licenseManager:
 *   post:
 *     summary: Assigns a license to a client
 *     description: Allows an admin to assign a license to a client based on the provided email and license ID. Checks for existing assignments and license validity.
 *     tags:
 *       - License Management
 *     operationId: assignLicense
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - licenseId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the client to whom the license will be assigned.
 *               licenseId:
 *                 type: string
 *                 description: The ID of the license to assign to the client.
 *     responses:
 *       201:
 *         description: License successfully assigned to the client.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "license assigned successfully"
 *                 userLicense:
 *                   type: object
 *                   properties:
 *                     license:
 *                       type: string
 *                     licenseEmail:
 *                       type: string
 *                       format: email
 *                     credits:
 *                       type: integer
 *                     licenseSecret:
 *                       type: string
 *                     expiryDate:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or the license is already assigned or expired.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       403:
 *         description: User does not have permission to assign licenses.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/licenseManager',auth,controllers.assignLicense);
/**
 * @openapi
 * /api/upgrade/license:
 *   post:
 *     summary: Upgrades a user's license
 *     description: Allows a user to upgrade their license by submitting a valid license secret. It checks if the license is valid, if it has already been activated, and updates the user's license status.
 *     tags:
 *       - License Management
 *     operationId: upgradeLicense
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - secret
 *             properties:
 *               secret:
 *                 type: string
 *                 description: Secret key associated with the license to be upgraded.
 *     responses:
 *       201:
 *         description: License upgraded and activated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "license activated successfully"
 *                 license:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     activated:
 *                       type: boolean
 *                       example: true
 *                     activatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error with the request data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: License not found or already activated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error or permissions error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/upgrade/license',auth,controllers.upgradePlan);
router.patch('/update',auth,controllers.updateUserLicense);


module.exports= router;