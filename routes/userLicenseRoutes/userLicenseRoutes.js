const express = require("express");
const router = express.Router();
const controller = require("../../controllers/userLicenseController/userLicense");
const auth= require ("../../middleware/auth")
/**
 * @openapi
 * /api/userlicense/activelicense:
 *   get:
 *     summary: Retrieves active license information for the user
 *     description: Fetches all active licenses associated with the authenticated user. Requires permissions to view active licenses.
 *     tags:
 *       - License Management
 *     operationId: getActiveLicenseInformation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved active license information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Licenses fetched successfully"
 *                 userLicenses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       activated:
 *                         type: boolean
 *                         example: true
 *                       license:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           numberOfUsers:
 *                             type: integer
 *                             description: Number of users allowed under this license.
 *       404:
 *         description: No active licenses found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No active license found"
 *       403:
 *         description: User does not have permission to view active licenses.
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

router.get("/userlicense/activelicense",auth, controller.getActiveLicenseInformation);
router.get("/userlicense/corporate/:license",auth, controller.getCorporateLicenseUsers);



module.exports = router;