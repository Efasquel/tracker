const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    isCompleted: {
      type: Boolean,
      default: false,
    },
    targetCompletionAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, _id: false },
);

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
    },
    logs: [logSchema],
  },
  { timestamps: true },
);

habitSchema.method("toJSON", function toJSON() {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = mongoose.model("HabitLog", habitSchema);
