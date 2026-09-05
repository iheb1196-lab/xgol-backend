const express = require('express');
const controllers = require("../../controllers/licenseController/license");
const router = express.Router();
const auth= require ("../../middleware/auth")


router.post('/license',auth,controllers.createLicense);
router.get('/license',auth , controllers.getLicenses);
/**
 * @openapi
 * /api/license/corporate:
 *   get:
 *     summary: Retrieves all licenses for the administrator's corporate
 *     description: Fetches all licenses associated with the corporate entity of the logged-in administrator. Requires permissions to view corporate licenses.
 *     tags:
 *       - License Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all licenses associated with the corporate.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Licenses fetched successfully"
 *                 licenses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       validity:
 *                         type: integer
 *                         description: Validity of the license in months
 *                       numberOfUsers:
 *                         type: integer
 *                         description: Number of users allowed under the license
 *       404:
 *         description: No licenses found for this corporate.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No licenses found for this corporate"
 *       403:
 *         description: User does not have the required permissions to view corporate licenses.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User does not have the required permissions"
 *       500:
 *         description: Internal server error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get('/license/corporate',auth , controllers.getCorporateLicensesAdmin);

router.get('/license/:corporate',auth , controllers.getCorporateLicenses);

module.exports= router;