const mongoose = require("mongoose");
Schema = mongoose.Schema;
const paymenthistorySchema = new mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    payment_status: {
      type: String,
      enum: ["pending", "success", "failed", "process"],
      default: "pending",
    },
    amount: {
      type: String,
      required: [true, "Amount is required."],
    },
    membership_type: {
      type: String,
      enum: ["subscription", "lifetime"],
      default: "subscription",
    },
    payment_id: {
      type: String,
      required: [true, "Payment id is required."],
    },
    payment_date: {
      type: Date,
      defaukt: null,
    },
    expiry_date: {
      type: Date,
      defaukt: null,
    },
    payment_json: {
      type: Object,
    },
    is_expire: {
      type: Boolean,
      enum: [true, false],
      default: false, // true-expire, false-Not_expire
    },
    is_cancel: {
      type: Boolean,
      enum: [true, false],
      default: false, // true-cancel, false-Not_cancel
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

module.exports = mongoose.model("payment_history", paymenthistorySchema);
