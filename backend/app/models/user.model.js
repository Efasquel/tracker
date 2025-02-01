const mongoose = require("mongoose");
const argon2 = require("argon2");

const emailRegex =
  /^(([^<>()\[\]\.,;:\s@"]+(\.[^<>()\[\]\.,;:\s@"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const schema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      match: [emailRegex, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "host", "member", "ancient"],
      default: "member",
      required: true,
    },
  },
  { timestamps: true },
);

schema.method("toJSON", function toJSON() {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

// Pre-save hook to hash the password
schema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    try {
      this.password = await argon2.hash(this.password);
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Method to compare passwords
schema.methods.validatePassword = (candidatePassword) => {
  return argon2.verify(this.password, candidatePassword);
};

module.exports = mongoose.model("User", schema);
