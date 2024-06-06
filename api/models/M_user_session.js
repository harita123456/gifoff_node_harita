const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const userSessionSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    user_type: {
      type: String,
      enum: ["user", "admin"],
      required: [true, "User type is required."],
    },
    device_token: {
      type: String,
      required: [true, "Device token is required."],
    },
    auth_token: {
      type: String,
      required: false,
    },
    device_type: {
      type: String,
      enum: ["ios", "android", "web"],
      required: [true, "Device type is required."],
    },
    is_deleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    is_active: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("user_session", userSessionSchema);
