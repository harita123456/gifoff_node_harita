const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const frinedSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "User id is required."],
    },
    friend_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Friend id is required."],
    },
    is_deleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("friends", frinedSchema);
