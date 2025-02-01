const db = require("../models");
const User = db.users;

/**
 * Create a user.
 * @param {*} req - request received containing a body with:
 *                  - name (String):     user name
 *                  - role (String):     user role
 * @param {*} res - response to send after dealing with the query.
 */
exports.create = async (req, res) => {
  const { name, role } = req.body;

  if (!name) {
    res.status(400).send({
      message: `Invalid name.`,
    });
    return;
  }

  const newUser = new User({ name, role });

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
      console.error(
        `Some error occured while creating user "${name}" (role=${role})`,
        err,
      );
      res.status(500).send({
        message: `Some error occured while creating user user "${name}" (role=${role})`,
      });
    });
};
