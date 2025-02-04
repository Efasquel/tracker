module.exports = (app) => {
  const users = require("../controllers/user.controller");
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

  app.use("/api/user", router);
};
