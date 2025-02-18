const db = require("../models");

const User = db.users;
const Habit = db.habits;
const HabitLog = db.habitLogs;

const { ObjectId } = db.mongoose.Types;

/**
 * Fetch the score of a user.
 * @param {*} req - request received containing in param:
 *                  - userId (String):  id of the user to fetch the score of.
 * @param {*} res - response to send after dealing with the query:
 *                  - The score achieved by the user and the maximum he could have done.
 */
exports.fetchUserScore = async (req, res) => {
  const { userId } = req.params;

  if (!userId || !ObjectId.isValid(userId)) {
    console.error(
      `Invalid user (id=${userId}) provided in the request made by ${req.user.userId} to get score.`,
    );
    return res
      .status(400)
      .send({ message: "Missing or invalid fields in the request" });
  }

  try {
    const user = await User.findById(userId).select({ habits: 1 });

    if (!user) {
      console.error(
        `Invalid userId (=${userId}) provided in the request made by ${req.user.userId} to get score.`,
      );
      return res.status(404).send({ message: "User not found" });
    }

    const userActiveHabitIds = user.habits
      .filter((habit) => habit.isActive)
      .map((habit) => habit.id);

    const activeHabits = await Habit.find({
      _id: userActiveHabitIds,
    }).select({ defaultScore: 1 });

    let scoreMax = 0;
    let score = 0;

    for (const activeHabit of activeHabits) {
      const habitLogs = await HabitLog.findOne({
        userId,
        habitId: activeHabit._id,
      }).select({
        logs: 1,
        _id: 0,
      });
      if (habitLogs) {
        scoreMax += habitLogs.logs.length * activeHabit.defaultScore;
        habitLogs.logs.forEach((log) => {
          if (log.isCompleted) {
            score += activeHabit.defaultScore;
          }
        });
      }
    }
    console.log(
      `User (id=${userId}) has a score of ${score}/${scoreMax} (request by ${req.user.userId})`,
    );
    return res.send({ score, scoreMax });
  } catch (err) {
    console.log(
      `Error while getting user score for user (id=${userId}) (request by ${req.user.userId})`,
    );
    return res.status(500).send({ message: "Internal Server Error" });
  }
};
