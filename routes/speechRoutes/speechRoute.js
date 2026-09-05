const express = require("express");
const router = express.Router();
const controller = require("../../controllers/speechController/speech");
const auth= require ("../../middleware/auth")
/**
 * @openapi
 * /api/speeches:
 *   get:
 *     summary: Retrieves all speeches for the logged-in user
 *     description: Fetches all speeches created by the authenticated user along with the count of associated videos for each speech. Requires permissions to view one's own speeches.
 *     tags:
 *       - Speech Management
 *     operationId: getSpeeches
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved the speeches.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 speeches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date
 *                         description: The date the speech was created, formatted as YYYY-MM-DD.
 *                       numberOfVideos:
 *                         type: integer
 *                         description: The count of videos associated with this speech.
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

router.get("/speeches",auth, controller.getSpeeches);
/**
 * @openapi
 * /api/speeches/{speech}:
 *   get:
 *     summary: Retrieves a specific speech
 *     description: Fetches details of a specific speech identified by its ID, accessible only to users with permission to view their own speeches.
 *     tags:
 *       - Speech Management
 *     operationId: getSpeech
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: speech
 *         required: true
 *         description: The ID of the speech to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved the speech.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 speech:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     text:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
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

router.get("/speeches/:speech",auth, controller.getSpeech);
/*
 * Legacy endpoint (removed): /speeches/{speech}/videos.
 * Practice history now lives at /api/practice/speeches/{speech}/sessions.
 *
 * @openapi-removed
 * /speeches/{speech}/videos:
 *   get:
 *     summary: Retrieves videos for a specific speech
 *     description: Fetches all videos related to a specified speech and provides aggregate evaluation scores if available. Requires permissions to access own speeches.
 *     tags:
 *       - Speech Management
 *     operationId: getMySpeechVideos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: speech
 *         required: true
 *         description: The ID of the speech to retrieve associated videos.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved the videos and evaluation scores.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 speechId:
 *                   type: string
 *                 videos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       pronAssessmentAnalysis:
 *                         type: string
 *                         description: JSON string containing detailed pronunciation assessment results.
 *                 averages:
 *                   type: object
 *                   properties:
 *                     overallScoreAvg:
 *                       type: number
 *                       format: float
 *                       description: Average overall pronunciation score.
 *                     prosodyScoreAvg:
 *                       type: number
 *                       format: float
 *                       description: Average prosody score.
 *                     accuracyScoreAvg:
 *                       type: number
 *                       format: float
 *                       description: Average accuracy score.
 *                     completenessScoreAvg:
 *                       type: number
 *                       format: float
 *                       description: Average completeness score.
 *                     fluencyScoreAvg:
 *                       type: number
 *                       format: float
 *                       description: Average fluency score.
 *       403:
 *         description: User does not have the required permissions to view the videos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User does not have the required permissions"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

router.delete("/speeches/:speech", auth, controller.deleteSpeech);
router.patch("/speeches/:speech", auth, controller.updateSpeech);



module.exports = router;
