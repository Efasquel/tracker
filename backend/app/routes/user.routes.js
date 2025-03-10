module.exports = (app) => {
  const users = require("../controllers/user.controller");
  const habits = require("../controllers/habit.controller");
  const stats = require("../controllers/stat.controller");

  const { authMiddleware } = require("../middleware/auth");

  const router = require("express").Router();

  // Create a user
  router.post("/", users.create);

  // Fetch a user
  router.get("/:id", authMiddleware, users.fetchOne);

  // Delete a user
  router.delete("/:id", authMiddleware, users.deleteOne);

  // Update a user
  router.patch("/:id", authMiddleware, users.updateOne);

  // Add a habit to a user
  router.post("/:id/habit", authMiddleware, habits.createHabitAndAddToUser);

  // Fetch user habits
  router.get("/:userId/habits", authMiddleware, habits.fetchHabitsFromUser);

  // Remove a habit from a user
  router.delete(
    "/:userId/habit/:habitId",
    authMiddleware,
    habits.removeHabitFromUser,
  );

  // Add a log for a habit
  router.post(
    "/:userId/habit/:habitId/track",
    authMiddleware,
    habits.trackHabit,
  );

  // Fetch user score
  router.get("/:userId/score", authMiddleware, stats.fetchUserScore);

  app.use("/api/user", router);
};
