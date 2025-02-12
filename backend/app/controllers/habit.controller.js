const db = require("../models");

const User = db.users;
const Habit = db.habits;
const HabitLog = db.habitLogs;

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
    (habit) => habit.id.name === name.trim(),
  );

  if (habitAlreadyFollowed) {
    console.log(
      `Habit '${name.trim()}' is already followed by user with id=${userId} (request by ${createdBy})`,
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

/**
 * Remove a habit from a user.
 * @param {*} req - request received with params:
 *                  - userId (String):        user id to whom adding the habit
 *                  - habitId (String):       id of the habit to remove
 * @param {*} res - response to send after dealing with the query.
 */
exports.removeHabitFromUser = async (req, res) => {
  const { userId, habitId } = req.params;

  if (!ObjectId.isValid(userId) || !ObjectId.isValid(habitId)) {
    console.error(
      `Invalid or missing userId ('${userId}') or habitId ('${habitId}') in requets to remove user habit made by ${req.user.userId}`,
    );
    return res
      .status(400)
      .send({ message: "Missing or invalid fields in the request" });
  }

  try {
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      console.error(
        `User (id=${userId}) not found while being requested to remove habit (id=${habitId} by ${req.user.userId}`,
      );
      return res.status(404).send({ message: "User not found" });
    }

    // Verify habit followed by user
    const habitExists = user.habits.some(
      (habit) => habit.id.toString() === habitId,
    );
    if (!habitExists) {
      console.error(
        `Habit (id=${habitId}) not found in user (id=${userId}) while being requested to be removed by ${req.user.userId}`,
      );
      return res
        .status(404)
        .send({ message: "User was not following such habit" });
    }

    // Remove habit from user
    User.updateOne(
      { _id: userId },
      { $pull: { habits: { id: habitId } } },
    ).then((result) => {
      if (result.modifiedCount === 0) {
        console.error(
          `Habit (id=${habitId}) not found in user (id=${userId}) while being requested to be removed by ${req.user.userId}`,
        );
        return res
          .status(404)
          .send({ message: "User was not following such habit" });
      }
      console.log(
        `Habit (id=${habitId}) followed by user (id=${userId}) successfully removed by ${req.user.userId}`,
      );
      return res.send({ message: "Habit successfully removed from user" });
    });
  } catch (err) {
    console.error(
      `Error while removing habit (id:${habitId}) from user (id=${userId}) as requested by ${req.user.userId}`,
      err,
    );
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

/**
 * Update a habit.
 * @param {*} req - request received with params and body:
 *                  - habitId (String):       id of the habit to remove
 *                  - name (String):          new habit name
 *                  - description (String):   new habit description
 *                  - isMandatory (Boolean):  new indicator of whether the habit is mandatory or not
 *                  - defaultScore (Number):  new default score for habit
 * @param {*} res - response to send after dealing with the query.
 */
exports.updateOne = async (req, res) => {
  const { habitId } = req.params;

  // Validate required fields
  if (!habitId || !ObjectId.isValid(habitId)) {
    console.error(
      `Missing or invalid habitId in the request made by ${req.user.userId}": ${habitId}`,
    );
    return res
      .status(400)
      .send({ message: "Missing or invalid fields in the request" });
  }

  // Check the data provided
  const newData = {};
  const { name, description, defaultScore, isMandatory } = req.body;

  if (name && name !== undefined) {
    newData.name = name;
  }
  if (description && description !== undefined) {
    newData.description = description;
  }
  if (defaultScore && defaultScore !== undefined) {
    if (isNaN(defaultScore) || typeof defaultScore === "boolean") {
      console.error(
        `Invalid field "defaultScore" provided to update habit (id=${habitId}) as requested by ${req.user.userId}:`,
        defaultScore,
      );
      return res
        .status(400)
        .send({ message: "Missing or invalid fields in the request" });
    }
    newData.defaultScore = defaultScore;
  }
  if (isMandatory && isMandatory !== undefined) {
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
    if (parsedIsMandatory === undefined) {
      console.error(
        `Invalid field "isMandatory" provided to update habit (id=${habitId}) as requested by ${req.user.userId}:`,
        isMandatory,
      );
      return res
        .status(400)
        .send({ message: "Missing or invalid fields in the request" });
    }
    newData.isMandatory = parsedIsMandatory;
  }

  if (Object.keys(newData).length === 0) {
    console.error(
      `No valid data provided to update habit (id=${habitId}) as requested by ${req.user.userId}:`,
      { name, description, isMandatory, defaultScore },
    );
    return res
      .status(400)
      .send({ message: "Missing or invalid fields in the request" });
  }

  // Update the habit with the new data
  Habit.updateOne(
    { _id: habitId },
    { $set: newData },
    { new: true, runValidators: true },
  )
    .then((result) => {
      if (!result.matchedCount) {
        console.error(
          `Habit requested to be updated (id=${habitId}) by ${req.user.userId} not found`,
        );
        return res.status(404).send({ message: "Habit not found" });
      }
      console.log(
        `Habit (id=${habitId}) successfully updated by ${req.user.userId} with following data:`,
        { newData },
      );
      return res.send({ message: "Done" });
    })
    .catch((err) => {
      console.error(
        `Error while updating user (id=${habitId}) as requested by ${req.user.userId} with following data:`,
        newData,
        err,
      );
      return res.status(500).send({ message: "Internal Server Error" });
    });
};

/**
 * Track whether a habit is completed for a day.
 * @param {*} req - request received with params and body:
 *                  - habitId (String):           id of the habit to remove
 *                  - userId (String):            id of the user following the habit
 *                  - isCompleted (Boolean):      whether habit is completed
 *                  - targetCompletionAt (Date):  when the habit is supposed to be completed
 * @param {*} res - response to send after dealing with the query.
 */
exports.trackHabit = async (req, res) => {
  const { userId, habitId } = req.params;

  const { isCompleted, targetCompletionAt } = req.body;

  // Sanitize isCompleted
  let parsedIsCompleted = undefined;
  if (typeof isCompleted === "boolean") {
    parsedIsCompleted = isCompleted;
  } else if (typeof isMandatory === "string") {
    if (isCompleted.toLowerCase() === "true") {
      parsedIsCompleted = true;
    } else if (isCompleted.toUpperCase() === "false") {
      parsedIsCompleted = false;
    }
  }

  // Sanitize targetCompletionAt
  let parsedTargetCompletionAt = new Date(targetCompletionAt);

  // Verify inputs
  if (
    !userId ||
    !ObjectId.isValid(userId) ||
    !habitId ||
    !ObjectId.isValid(habitId) ||
    !(parsedTargetCompletionAt instanceof Date) ||
    Number.isNaN(parsedTargetCompletionAt.getTime()) ||
    parsedIsCompleted == undefined
  ) {
    console.error(
      `Missing or invalid fields in the request made by ${req.user.userId} to update habit(id=${habitId}) from user (id=${userId})":`,
      { isCompleted, targetCompletionAt },
    );
    return res
      .status(400)
      .send({ message: "Missing or invalid fields in the request" });
  }

  parsedTargetCompletionAt = new Date(
    parsedTargetCompletionAt.toISOString().split("T")[0],
  );

  // Update or create habit log
  try {
    const result = await HabitLog.updateOne(
      { habitId, userId, "logs.targetCompletionAt": parsedTargetCompletionAt },
      {
        $set: {
          "logs.$.isCompleted": parsedIsCompleted,
        },
      },
    );

    // If habit log not found, create one
    if (result.matchedCount === 0) {
      await HabitLog.updateOne(
        { userId, habitId },
        {
          $push: {
            logs: {
              isCompleted: parsedIsCompleted,
              targetCompletionAt: parsedTargetCompletionAt,
            },
          },
        },
        { upsert: true },
      );
    }
    console.log(
      `Habit (id=${habitId}) tracked for user (id=${userId}) as requested by ${req.user.userId}:`,
      {
        isCompleted: parsedIsCompleted,
        targetCompletionAt: parsedTargetCompletionAt,
      },
    );
    return res.send({ message: "Habit successfully tracked." });
  } catch (err) {
    console.error(
      `Error while tracking habit (id=${habitId}) for user (id=${userId}) as requested by ${req.user.userId}`,
      err,
    );
    return res.status(500).send({ message: "Internal Server Error" });
  }
};
