const jwt = require("jsonwebtoken");

/**
 * Verify the token provided by a user.
 * @param {*} req - request received containing in header:
 *                  - token (String)    Token passed in Authorization header.
 * @param {*} res - response to send after dealing with the query:
 *                  - execute next function, or return an error message for invalid token.
 */
exports.authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .send({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).send({ message: "Token has expired." });
    }
    res.status(400).send({ message: "Invalid token." });
  }
};
