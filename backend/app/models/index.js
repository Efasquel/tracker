const dbConfig = require("../config/db.config");

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;
db.users = require("./user.model");
db.habits = require("./habit.model");
db.habitLogs = require("./habitLog.model");

module.exports = db;
