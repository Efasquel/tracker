const jwt = require("jsonwebtoken");

const db = require("../models");
const User = db.users;

/**
 * Authenticate a user and fetch the token.
 * @param {*} req - request received containing a body with:
 *                  - email (String):       email address to idenfiy user
 *                  - password (String):    user password to authenticate user
 * @param {*} res - response to send after dealing with the query, with:
 *                  - a token if user successfully authenticated
 *                  - else an error message
 */
exports.authenticate = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send({
      message: `Invalid email or password.`,
    });
    return;
  }

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(400).send({ error: "Invalid email or password" });
      }
      return user.validatePassword(password).then((isVerified) => {
        if (!isVerified) {
          console.log(`[AUTH] Invalid password provided for '${user.email}'`);
          return res.status(400).send({ error: "Invalid email or password" });
        }
        console.log(`[AUTH] Valid authentication of '${user.email}'`);
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });
        res.status(200).send({ message: "Login successful", token: token });
      });
    })
    .catch((err) => {
      console.log("[AUTH] Error while authenticating user", err);
      res.status(500).send({ error: "Internal Server Error" });
    });
};
