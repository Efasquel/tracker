module.exports = (app) => {
  const users = require("../controllers/user.controller");
  const habits = require("../controllers/habit.controller");

  const { authMiddleware } = require("../middleware/auth");

  const router = require("express").Router();

  // Create a user
  router.post("/", users.create);

  // Fetch a user
  router.get("/:id", authMiddleware, users.fetchOne);

  // Delete a user
  router.delete("/:id", authMiddleware, users.deleteOne);

  // Update a user or a set of users
  router.patch("/:id", authMiddleware, users.updateOne);

  // Add a habit to a user
  router.post("/:id/habit", authMiddleware, habits.createHabitAndAddToUser);

  // Remove a habit from a user
  router.delete(
    "/:userId/habit/:habitId",
    authMiddleware,
    habits.removeHabitFromUser,
  );

  app.use("/api/user", router);
};
