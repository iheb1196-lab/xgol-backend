const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided. Unauthorized" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWTPRIVATEKEY);
    req.user = verified;

 
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      res.status(401).json({ message: "Token expired. Please log in again" });
    } else {
      console.error(err);
      res.status(401).json({ message: "Invalid token. Unauthorized" });
    }
  }
}
module.exports = auth;