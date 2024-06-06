const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const roundSubmissionSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "User id is required."],
    },
    game_id: {
      type: Schema.Types.ObjectId,
      ref: "categories",
      required: [true, "Category id is required."],
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "categories",
      required: [true, "Category id is required."],
    },
    clue_id: {
      type: Schema.Types.ObjectId,
      ref: "clues",
      required: [true, "Clue id is required."],
    },
    round: {
      type: Number,
      required: [true, "Round is required."],
    },
    gif_name: {
      type: String,
      required: [true, "GIF name is required."],
    },
    is_url: {
      type: Boolean,
      default: false, // true - this is full gif/image url
    },
    is_win: {
      type: Boolean,
      default: false, // true - that user is winner of that round
    },
    is_extra_round: {
      type: Boolean,
      required: true,
      default: false,
    },
    is_deleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("round_submission", roundSubmissionSchema);
