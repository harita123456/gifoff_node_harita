const mongoose = require("mongoose");

const appVersionSchema = new mongoose.Schema(
  {
    app_version: {
      type: String,
      required: [true, "App version is required."],
    },
    is_maintenance: {
      type: Boolean,
      enum: [true, false],
      default: false, // true-Yes, false-No
    },
    app_update_status: {
      type: String,
      enum: ["is_force_update", "is_not_need"],
      default: "is_not_need",
    },
    app_platform: {
      type: String,
      enum: ["ios", "android"],
      required: [true, "App platform is required."],
    },
    app_url: {
      type: String,
      required: [true, "App URL is required."],
    },
    api_base_url: {
      type: String,
      required: [true, "App URL is required."],
    },
    is_live: {
      type: Boolean,
      enum: [true, false],
      default: true, // true-Live, false-Not live
    },
    is_deleted: {
      type: Boolean,
      enum: [true, false],
      default: false, // true-deleted, false-Not_deleted
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("app_version", appVersionSchema);
