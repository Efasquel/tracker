const db = require("../models");

const User = db.users;
const Habit = db.habits;

const { ObjectId } = db.mongoose.Types;

/**
 * Create a habit and add it to a user if not already followed by the user.
 * @param {*} req - request received containing a body with:
 *                  - userId (String):        user id to whom adding the habit
 *                  - name (String):          habit name
 *                  - description (String):   habit description
 *                  - defaultScore (Number):  habit default score
 *                  - isMandatory (String):   whether habit is mandatory or not
 * @param {*} res - response to send after dealing with the query.
 */
exports.createHabitAndAddToUser = async (req, res) => {
  const { name, description, defaultScore, isMandatory } = req.body;

  const userId = req.params.id;
  const createdBy = req.user.userId;

  // Sanitize defaultScore
  const parsedDefaultScore =
    typeof defaultScore === "string" ? Number(defaultScore) : defaultScore;

  // Sanitize isMandatory
  let parsedIsMandatory = undefined;
  if (typeof isMandatory === "boolean") {
    parsedIsMandatory = isMandatory;
  } else if (typeof isMandatory === "string") {
    if (isMandatory.toLowerCase() === "true") {
      parsedIsMandatory = true;
    } else if (isMandatory.toUpperCase() === "false") {
      parsedIsMandatory = false;
    }
  }

  // Validate required fields
  if (
    !userId ||
    !ObjectId.isValid(userId) ||
    !name ||
    typeof name !== "string" ||
    (description && typeof description !== "string") ||
    isNaN(parsedDefaultScore) ||
    parsedIsMandatory === undefined
  ) {
    console.error(
      `Missing or invalid fields in the request made by ${createdBy}":`,
      { name, description, parsedDefaultScore, parsedIsMandatory, userId },
    );
    return res
      .status(400)
      .send({ message: "Missing or invalid fields in the request" });
  }

  // Check whether the habit is already followed by user
  const user = await User.findById(userId).populate("habits.id", "name").exec();

  const habitAlreadyFollowed = user.habits.some(
    (habit) => habit.id.name === name,
  );

  if (habitAlreadyFollowed) {
    console.log(
      `Habit '${name}' is already followed by user with id=${userId} (request by ${createdBy})`,
    );
    return res
      .status(409)
      .send({ message: "Habit name already taken for this user." });
  }

  // Create new habit and add it to user
  const habit = new Habit({
    name,
    description,
    defaultScore: parsedDefaultScore,
    isMandatory: parsedIsMandatory,
    createdBy,
  });

  habit
    .save()
    .then(async (savedHabit) => {
      user.habits.push({ id: savedHabit._id });
      await user.save();
      console.log(
        `Habit (id=${savedHabit._id}) created and successfully added to user (id=${userId}) as requested by ${createdBy}.`,
      );
      return res.send({ message: "Habit successfully added to user." });
    })
    .catch((err) => {
      console.error(
        `Error while adding a habit to user (id=${userId} as requested by ${createdBy}:`,
        err,
      );
      return res.status(500).send("Internal Server Error");
    });
};
