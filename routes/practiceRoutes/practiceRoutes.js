const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const { uploadAudio } = require("../../middleware/uploadAudio");
const controllers = require("../../controllers/practiceController/practice");

/**
 * @openapi
 * /api/practice/improve-script:
 *   post:
 *     summary: Improve a script with AI (streamed)
 *     description: Streams an improved version of the script back as Server-Sent Events, tailored to the user's objective.
 *     tags:
 *       - Practice
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *               objective:
 *                 type: string
 *               duration:
 *                 type: string
 *     responses:
 *       200:
 *         description: SSE stream of improvement deltas.
 */
router.post("/practice/improve-script", auth, controllers.improveScript);

/**
 * @openapi
 * /api/practice/sessions:
 *   post:
 *     summary: Submit a practice recording for AI evaluation (streamed)
 *     description: Stores the audio locally, sends the raw WAV recording to Gemma 4 through Bedrock Mantle, and streams feedback as Server-Sent Events.
 *     tags:
 *       - Practice
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *               - speech
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *               speech:
 *                 type: string
 *               objective:
 *                 type: string
 *               duration:
 *                 type: number
 *     responses:
 *       200:
 *         description: SSE stream of feedback deltas.
 */
router.post("/practice/sessions", auth, uploadAudio, controllers.submitPractice);

router.get("/practice/sessions", auth, controllers.listSessions);
router.get("/practice/sessions/:session", auth, controllers.getSession);
router.get("/practice/sessions/:session/audio", auth, controllers.getSessionAudio);
router.delete("/practice/sessions/:session", auth, controllers.deleteSession);
router.get("/practice/speeches/:speech/sessions", auth, controllers.getSpeechSessions);

module.exports = router;
