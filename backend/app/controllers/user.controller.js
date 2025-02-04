const db = require("../models");
const User = db.users;
const { ObjectId } = db.mongoose.Types;

/**
 * Create a user.
 * @param {*} req - request received containing a body with:
 *                  - email (String):       email address to idenfiy user
 *                  - password (String):    user password to authenticate user
 *                  - name (String):        user name
 *                  - role (String):        user role
 * @param {*} res - response to send after dealing with the query:
 *                  - user (User):          all data related to a user
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
      res.send({ user: savedUser });
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
        message: "Server Internal Error",
      });
    });
};

/**
 * Fetch a user.
 * @param {*} req - request received containing in param:
 *                  - id (String):    user id to retrieve the data.
 * @param {*} res - response to send after dealing with the query:
 *                  - user (User):          all data related to a user
 */
exports.fetchOne = async (req, res) => {
  const requestedUserId = req.params?.id;

  if (!requestedUserId || !ObjectId.isValid(requestedUserId)) {
    console.error(
      `No user id provided (or invalid one) by ${req.user.userId}: ${requestedUserId}`,
    );
    return res.status(400).send({ message: "Invalid id provided." });
  }

  User.findOne({ _id: requestedUserId })
    .then((requestedUser) => {
      if (!requestedUser) {
        console.log(
          `No user with id=${requestedUserId} as requested by ${req.user.userId}.`,
        );
        return res.status(404).send({ message: "User not found." });
      }
      console.log(
        `User with id=${requestedUserId} successfully fetched by ${req.user.userId}`,
      );
      return res.send({ user: requestedUser });
    })
    .catch((err) => {
      console.error(
        `Error while finding user with id=${requestedUserId} for ${req.user.userId}:`,
        err,
      );
      return res.status(500).send({ message: "Server Internal Error" });
    });
};
