const mongoose = require("mongoose");

const roundDetailSchema = new mongoose.Schema(
  {
    game_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "games",
      required: [true, "Game id is required."],
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "games",
      required: [true, "Category id is required."],
    },
    clue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "games",
      required: [true, "Clue id is required."],
    },
    round: {
      type: Number,
      required: [true, "Round is required."],
    },
    players_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    round_status: {
      type: String,
      enum: [
        "waiting",
        "in_progress",
        "completed",
        "round_winner_selected",
        "game_winner_selected",
      ],
      default: "waiting",
    },
    judge_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
    win_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
    is_reveal_result: {
      type: Boolean,
      enum: [true, false],
      default: false, // true-This match's result reveals by judge
    },
    is_sudden_death: {
      type: Boolean,
      enum: [true, false],
      default: false, // true-this match is suddenly death due to multiple user's have score
    },
    is_draw: {
      type: Boolean,
      enum: [true, false],
      default: false, // true-this match have draw in multiple users
    },
    is_completed: {
      type: Boolean,
      enum: [true, false],
      default: false, // true-this match is the rematch of parent rematch_game_id
    },
    is_deleted: {
      type: Boolean,
      enum: [true, false],
      default: false, // true-deleted, false-Not_deleted
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("round_details", roundDetailSchema);
