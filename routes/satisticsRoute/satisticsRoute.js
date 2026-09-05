const express = require('express');
const router = express.Router();
const controllers = require("../../controllers/satisticsController/satistics");

const auth= require ("../../middleware/auth")
/**
 * @openapi
 * /api/dashboard/client/statistics:
 *   get:
 *     summary: Retrieves speech statistics for the logged-in client
 *     description: Fetches statistics such as the number of unique speeches practiced, the number of videos recorded, and the total duration of these videos for the authenticated client.
 *     tags:
 *       - Satistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved the speech statistics.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     uniqueSpeechesPracticed:
 *                       type: integer
 *                       description: Number of unique speeches the client has practiced.
 *                       example: 10
 *                     numberOfVideosRecorded:
 *                       type: integer
 *                       description: Total number of videos recorded by the client.
 *                       example: 25
 *                     totalDuration:
 *                       type: integer
 *                       description: Total duration of all recorded videos in seconds.
 *                       example: 1200
 *       500:
 *         description: Failed to retrieve speech statistics due to an internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 error:
 *                   type: string
 *                   example: Failed to calculate user speech statistics due to an internal server error.
 */
router.get('/dashboard/client/statistics',auth,controllers.calculateUserSpeechStatistics);
router.get('/dashboard/expert/statistics',auth,controllers.calculateExpertStatistics);
router.get('/dashboard/client/transactions',auth,controllers.userTransactions);
/**
 * @openapi
 * /api/dashboard/admin/statistics/{license}:
 *   get:
 *     summary: Fetches corporate license usage statistics
 *     description: Retrieves detailed statistics regarding the usage of a specific license by clients, including total video durations, number of evaluated videos, and user-specific data.
 *     tags:
 *       - Satistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: license
 *         required: true
 *         description: The ID of the license for which statistics are being fetched.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved the statistics for the specified license.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 numberOfUserWithLicenses:
 *                   type: integer
 *                   description: Number of users who have been assigned this license.
 *                   example: 150
 *                 numberOfAllowedUsersWithinLicense:
 *                   type: integer
 *                   description: Maximum number of users allowed under this license.
 *                   example: 200
 *                 totalDuration:
 *                   type: integer
 *                   description: Total duration of all videos associated with this license.
 *                   example: 12000
 *                 totalEvaluatedVideos:
 *                   type: integer
 *                   description: Number of videos that have been evaluated under this license.
 *                   example: 100
 *                 userDetails:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       active:
 *                         type: boolean
 *                         description: Whether the license is activated for the user.
 *                         example: true
 *                       email:
 *                         type: string
 *                         format: email
 *                         description: Email address associated with the user license.
 *                         example: user@example.com
 *                       evaluatedVideosCount:
 *                         type: integer
 *                         description: Number of evaluated videos by the user.
 *                         example: 10
 *                       totalDurationEvaluatedVideos:
 *                         type: integer
 *                         description: Total duration of evaluated videos by the user.
 *                         example: 300
 *       500:
 *         description: Internal server error or permissions error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User does not have the required permissions"
 */
router.get('/dashboard/admin/satistics/:license',auth,controllers.calculateCorporateSpeechStatistics);




module.exports= router;