const express = require("express");
const controllers = require("../../controllers/featureController/feature");
const router = express.Router();
const auth = require("../../middleware/auth");

/**
 * @openapi
 * /api/feature/addspeech:
 *   post:
 *     summary: Adds a new speech
 *     description: Allows a user to add a new speech if they have the necessary feature access permission.
 *     tags:
 *       - Feature management
 *     operationId: addSpeech
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
 *               - title
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text of the speech to be added.
 *               title:
 *                 type: string
 *                 description: The title of the speech.
 *     responses:
 *       200:
 *         description: Speech added successfully.
 *       403:
 *         description: Missing permission or insufficient license credits.
 *       500:
 *         description: Internal server error.
 */
router.post("/feature/addspeech", auth, controllers.addSpeech);

module.exports = router;
