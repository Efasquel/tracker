module.exports = (app) => {
  const users = require("../controllers/auth.controller");

  const router = require("express").Router();

  // Authenticate a user
  router.post("/", users.authenticate);

  app.use("/api/login", router);
};
