module.exports = (app) => {
  const users = require("../controllers/user.controller");

  const router = require("express").Router();

  // Create a user
  router.post("/", users.create);

  app.use("/api/user", router);
};
