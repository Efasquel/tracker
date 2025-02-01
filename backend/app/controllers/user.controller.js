const db = require("../models");
const User = db.users;

/**
 * Create a user.
 * @param {*} req - request received containing a body with:
 *                  - email (String):       email address to idenfiy user
 *                  - password (String):    user password to authenticate user
 *                  - name (String):        user name
 *                  - role (String):        user role
 * @param {*} res - response to send after dealing with the query.
 */
exports.create = async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    res.status(400).send({
      message: `Invalid email or password or name.`,
    });
    return;
  }

  const newUser = new User({ email, password, name, role });

  newUser
    .save()
    .then((savedUser) => {
      console.log(`User "${name}" successfully created.`);
      res.send(savedUser);
    })
    .catch((err) => {
      if (err.name === "ValidationError" && err.errors.role) {
        res.status(400).send({
          message: `Invalid role.`,
        });
        return;
      }
      if (err.code === 11000 && err.keyPattern.email) {
        res.status(400).send({
          message: `User already exists`,
        });
        return;
      }
      console.error(
        `Some error occured while creating user with email "${email}" (role=${role}, name=${name})`,
        err,
      );
      res.status(500).send({
        message: `Some error occured while creating user with email "${email}"`,
      });
    });
};
