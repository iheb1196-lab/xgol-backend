const express = require("express");
const authController = require("../../controllers/userController/auth");
const registrationController = require("../../controllers/userController/userRegistration");
const forgotPasswordController = require("../../controllers/userController/forgotPasswrod");
const infoController = require("../../controllers/userController/user");
const superAdminController = require("../../controllers/superAdminController/users");
const router = express.Router();
const auth = require("../../middleware/auth");
router.post("/user/assign", auth, infoController.assignSnackCoachingExpert);
router.get("/user/credits", auth, infoController.getUserCredits);
router.post("/signup/superadmin", auth, registrationController.addSuperAdmin);
/**
 * @openapi
 * /api/signup/admin:
 *   post:
 *     summary: Registers a new administrator
 *     description: Allows a super admin to register a new administrator. The endpoint checks for permissions, validates the provided data, creates the user, assigns roles, and sends a password configuration link if necessary.
 *     tags:
 *       - User registration
 *     operationId: addAdmin
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
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the administrator to register.
 *               firstName:
 *                 type: string
 *                 description: First name of the administrator.
 *               lastName:
 *                 type: string
 *                 description: Last name of the administrator.
 *               otherProperties:
 *                 description: "Additional required or optional properties for admin registration"
 *     responses:
 *       201:
 *         description: Administrator registration successful, and necessary configuration steps initiated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Signup success"
 *       400:
 *         description: Validation error with the request or a verification email has been sent for an unverified account.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "A verification email has been sent to your account."
 *       409:
 *         description: User with the given email already exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User with given email already exists!"
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
router.post("/signup/admin", auth, registrationController.addAdmin);

/**
 * @openapi
 * /api/email/{token}:
 *   get:
 *     summary: Fetches the email associated with a given token
 *     description: Retrieves the email address of a user by verifying the provided token. If the token is valid and the user exists, returns the user's email.
 *     tags:
 *       - User management
 *     operationId: getUserEmail
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         description: The token that needs to be verified to fetch the email.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The request has succeeded and the email is returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: Email address of the user.
 *       400:
 *         description: Token is not provided or the user does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User does not exist or token is invalid."
 *       401:
 *         description: No token provided or the token is unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No token provided. Unauthorized."
 *       500:
 *         description: Internal server error or problem during the processing.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error."
 */

router.get("/email/:token", infoController.getUserEmail);



/**
 * @openapi
 * /api/signup/expert:
 *   post:
 *     summary: Registers a new expert
 *     description: Registers a new expert by a super admin. Validates the provided data, checks if the user already exists, assigns roles, and sends a password configuration link. Requires admin privileges.
 *     tags:
 *       - User registration
 *     operationId: addExpert
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
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the expert to register.
 *               firstName:
 *                 type: string
 *                 description: First name of the expert.
 *               lastName:
 *                 type: string
 *                 description: Last name of the expert.
 *     responses:
 *       201:
 *         description: Expert registration successful, verification email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Signup success"
 *       400:
 *         description: Validation error with the request or a verification email has been sent for an unverified account.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "A verification email has been sent to your account."
 *       409:
 *         description: User with the given email already exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User with given email already exists!"
 *       500:
 *         description: Internal Server Error or permissions error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User does not have the required permissions"
 * 
 */
router.post("/signup/expert", auth, registrationController.addExpert);
router.post("/signup/client", registrationController.clientSignUp);
/**
 * @openapi
 * /api/login:
 *   post:
 *     summary: Authenticates a user
 *     description: Logs in a user by validating their credentials. If the user is not verified, it triggers a verification or password reset process depending on their role. On successful authentication, returns an access token for subsequent requests.
 *     tags:
 *       - User authentification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password.
 *     responses:
 *       201:
 *         description: Successfully authenticated. Returns an access token and user details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token for authentication.
 *                 user:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     email:
 *                       type: string
 *                       format: email
 *       400:
 *         description: Validation error with the request body.
 *       401:
 *         description: Unauthorized - incorrect password or account not verified.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post("/login", authController.login);
/**
 * @openapi
 * /api/passwordReset/{token}:
 *   post:
 *     summary: Resets the user's password
 *     description: Allows a user to reset their password using a token sent to their email. The token is validated, and if successful, the user's password is updated.
 *     tags:
 *       - Password Reset
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: The token provided for password reset.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: New password for the user account.
 *     responses:
 *       200:
 *         description: Password has been reset successfully.
 *       400:
 *         description: Validation error with the provided password.
 *       401:
 *         description: No token provided or token is invalid. Unauthorized.
 *       403:
 *         description: Token verification failed.
 *       404:
 *         description: User associated with the token does not exist.
 *       500:
 *         description: Internal server error occurred.
 */
router.post("/passwordReset/:token", forgotPasswordController.resetPassword);
/**
 * @openapi
 * /api/passwordReset:
 *   post:
 *     summary: Initiates a password reset process
 *     description: Takes a user's email and triggers a process to send them a password reset token if the user exists.
 *     tags:
 *       - Password Reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the user who wants to reset the password.
 *     responses:
 *       201:
 *         description: An email with password reset instructions has been sent to the user.
 *       400:
 *         description: There was a validation error with the provided email.
 *       404:
 *         description: No user found with the provided email address.
 *       500:
 *         description: An error occurred during the process.
 */
router.post("/passwordReset", forgotPasswordController.forgotPassword);

/**
 * @openapi
 * /api/accountVerification/passwordReset/{token}:
 *   post:
 *     summary: First-time password configuration for new admin/expert/super admin
 *     description: Allows new admin, expert, and super admin users to set their password for the first time using a token sent to their email.
 *     tags:
 *       - Account Configuration
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: The password configuration token provided via email.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: New password to be set by the user.
 *     responses:
 *       200:
 *         description: Password configuration successful, account is now activated.
 *       400:
 *         description: Validation error with the request body or the user does not exist.
 *       401:
 *         description: No token provided, token has expired, or token is invalid. Unauthorized.
 *       500:
 *         description: Internal server error occurred.
 */
router.post(
  "/accountVerification/passwordReset/:token",
  forgotPasswordController.firstLoginPasswordConfiguration
);
/**
 * @openapi
 * /api/accountVerification/{token}:
 *   post:
 *     summary: Verifies a new user account
 *     description: Verifies the user's account using a token sent via email upon registration. This endpoint confirms the user's email and activates their account.
 *     tags:
 *       - Account Verification
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: The verification token sent to the user's email upon registration.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The account has been verified and activated successfully.
 *       401:
 *         description: No token was provided, or the provided token is invalid or expired. Unauthorized.
 *       403:
 *         description: The token failed verification.
 *       404:
 *         description: The user or license does not exist.
 *       500:
 *         description: An internal server error occurred.
 */
router.post(
  "/accountVerification/:token",
  registrationController.accountVerification
);
/**
 * @openapi
 * /api/refresh:
 *   get:
 *     summary: Refreshes the authentication token
 *     description: Validates the refresh token sent via HTTP-only cookies and issues a new access token if the refresh token is valid.
 *     tags:
 *       - User authentification
 *     responses:
 *       200:
 *         description: Successfully validated the refresh token and issued a new access token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: New JWT access token for authentication.
 *       401:
 *         description: No refresh token provided or the user does not exist. Unauthorized.
 *       403:
 *         description: Refresh token is invalid or has expired. Forbidden.
 *       500:
 *         description: An internal server error occurred.
 *     security:
 *       - cookieAuth: []
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: jwt
 */
router.get("/refresh", authController.refresh);

router.get("/reporting/Attijari", superAdminController.getAttijariUsers);
router.post("/users", superAdminController.updateUserJournals);
router.get("/users", superAdminController.journals);

/**
 * @openapi
 * /api/logout:
 *   post:
 *     summary: Logs out a user
 *     description: Clears the authentication cookie to log out the user.
 *     tags:
 *       - User authentification
 *     responses:
 *       200:
 *         description: Successfully logged out and cleared the authentication cookie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "logout success."
 *       500:
 *         description: An internal server error occurred.
 *     security:
 *       - cookieAuth: []
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: jwt
 */

router.post("/logout", authController.logout);

module.exports = router;
