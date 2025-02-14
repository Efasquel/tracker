module.exports = (app) => {
  const habits = require("../controllers/habit.controller");

  const { authMiddleware } = require("../middleware/auth");

  const router = require("express").Router();

  // Update a habit
  router.patch("/:habitId", authMiddleware, habits.updateOne);

  app.use("/api/habit", router);
};
