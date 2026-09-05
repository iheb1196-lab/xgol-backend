const User = require("../../models/user");
const { validateLogin } = require("../../validators/userValidator.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const handleResetPassword = require("../../utils/resetPassword.js");
const handleVerifyAccount = require("../../utils/verifyAccount.js");
const UserLicense = require("../../models/userLicense");

const login = async (req, res) => {
  try {
    const { error } = validateLogin(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }


    const emailLower = req.body.email.toLowerCase().trim();
    console.log(emailLower);

    const foundUser = await User.findOne({
      "emails.0": emailLower,
    })
      .populate({
        path: "role",
        populate: {
          path: "permissions",
          model: "Permission",
        },
      })
      .exec();

    if (!foundUser) {
      return res.status(404).json({ message: "user not found" });
    }

    if (!foundUser.verified) {
      if (foundUser.role[0] && foundUser.role[0].name === "CLIENT") {
        const userLicense = await UserLicense.findOne({ user: foundUser._id });
        await handleVerifyAccount(foundUser, emailLower, userLicense);
        return res
          .status(401)
          .json({
            message:
              "Your account is not verified! A verification is sent to your email! please confirm you're account",
          });
      } else {
        //For the other roles {admin , expert , superadmin}
        await handleResetPassword(foundUser, emailLower);
        return res
          .status(401)
          .json({ message: "Please reset your password to proceed" });
      }
    }
    const roles = foundUser.role.map((role) => role.name);
    const permissions = [
      ...new Set(
        foundUser.role.flatMap((role) =>
          role.permissions.map((permission) => permission.name)
        )
      ),
    ];
    const match = await bcrypt.compare(req.body.password, foundUser.password);
    if (!match) {
      return res
        .status(401)
        .json({ message: "Unauthorized - incorrect password" });
    }


    const user = {
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
      roles: roles, // roles is already an array of role names
      email: foundUser.emails[0], // Send only the first email
      hasSeenWalkthrough: Boolean(foundUser?.hasSeenWalkthrough)

    };

    const accessToken = jwt.sign(
      {
        id: foundUser._id,
        username: foundUser.userName,
        emails: foundUser.emails,
        roles,
        permissions,
      },
      process.env.JWTPRIVATEKEY
    );

    const refreshToken = jwt.sign(
      { username: foundUser.userName, email: emailLower },
      process.env.JWTPRIVATEKEY
    );
    console.log(user);

    // Create secure cookie with refresh token
    res.cookie("jwt", refreshToken, {
      httpOnly: true, //accessible only by web server
      secure: true, //https
      sameSite: "None", //cross-site cookie
      maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
    });

   

    if (!user?.hasSeenWalkthrough) {
      //for next login
      foundUser.hasSeenWalkthrough = true;
      await foundUser.save();
    }

    // Send accessToken containing username and roles
    res.status(201).json({ accessToken, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const refresh = (req, res) => {
  try {
    const cookies = req.cookies;

    if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

    const refreshToken = cookies.jwt;

    jwt.verify(
      refreshToken,
      process.env.JWTPRIVATEKEY,
      async (err, decoded) => {
        if (err) return res.status(403).json({ message: "Forbidden" });

        const foundUser = await User.findOne({
          "emails.0": decoded.email,
        })
          .populate({
            path: "role",
            populate: {
              path: "permissions",
              model: "Permission",
            },
          })
          .exec();

        if (!foundUser)
          return res.status(401).json({ message: "Unauthorized" });
        const roles = foundUser.role.map((role) => role.name);
        const permissions = [
          ...new Set(
            foundUser.role.flatMap((role) =>
              role.permissions.map((permission) => permission.name)
            )
          ),
        ];

        const accessToken = jwt.sign(
          {
            username: foundUser.userName,
            emails: foundUser.emails,
            roles,
            permissions,
          },
          process.env.JWTPRIVATEKEY
        );

        res.json({ accessToken });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const logout = async (req, res) => {
  try {
    // Clear the authentication cookie
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });
    return res.status(200).json({ message: "logout sucess." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  login,
  refresh,
  logout,
};
