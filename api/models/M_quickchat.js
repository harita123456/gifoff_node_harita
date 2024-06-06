const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const quickchatSchema = new Schema(
  {
    chat_message: {
      type: String,
      required: [true, "chat_name is required."],
    },
    order:
    {
      type: Number,
      default: 0,
    },
    is_deleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("quickChat", quickchatSchema);
