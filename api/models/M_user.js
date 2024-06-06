const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema(
  {
    user_type: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      // required: [true, "User type is required."],
    },
    name: {
      type: String,
      default: null,
      // required: [true, "User full name is required."],
    },
    email_address: {
      type: String,
      trim: true,
      index: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: "Your email is not valid please enter the correct email",
      },

      required: [true, "Email address is required."],
    },
    password: {
      type: String,
      default: null,
      // required: [true, "Password is required."],
    },
    dob: {
      type: Date,
      default: null,
      // required: [true, "Date of birth is required."],
    },
    profile_picture: {
      type: String,
      default: null,
    },
    bio: { type: String, default: null },
    is_self_delete: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    otp: {
      type: Number,
      length: [4, "OTP must be 4 digit."],
      default: null,
      // required: [true, "OTP is required."]
    },
    is_social_login: {
      type: Boolean,
      enum: [true, false],
      default: false, // true- login with social id, false- normal login
    },
    profile_url: {
      type: String,
      default: null,
    },
    social_id: {
      type: String,
      default: null,
    },
    social_platform: {
      type: String,
      enum: ["google", "facebook", "apple"],
      default: null,
    },
    membership_type: {
      type: String,
      enum: ["none", "subscription", "lifetime", "subscription_expire"],
      default: "none",
    },
    noti_badge: {
      type: Number,
      default: 0,
    },
    socket_id:
    {
      type: String,
      default: null,
    },
    app_version: {
      type: String,
      required: false,
    },
    is_super_user: {
      type: Boolean,
      enum: [true, false],
      default: false, // true- that user have all premium acsess without subscription
    },
    is_login: {
      type: Boolean,
      enum: [true, false],
      default: true, // true-login, false-Not_login
    },
    is_block: {
      type: Boolean,
      enum: [true, false],
      default: false, // true-block, false-Not block
    },
    is_deleted: {
      type: Boolean,
      enum: [true, false],
      default: false, // true-deleted, false-Not_deleted
    },
  },
  { timestamps: true, versionKey: false }
);

// usersSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("users", usersSchema);
