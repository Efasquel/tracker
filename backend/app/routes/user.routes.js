module.exports = (app) => {
  const users = require("../controllers/user.controller");
  const { authMiddleware } = require("../middleware/auth");

  const router = require("express").Router();

  // Create a user
  router.post("/", users.create);

  // Fetch a user
  router.get("/:id", authMiddleware, users.fetchOne);

  app.use("/api/user", router);
};
