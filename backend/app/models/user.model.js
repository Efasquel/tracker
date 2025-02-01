const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
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

module.exports = mongoose.model("User", schema);
