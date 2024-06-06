const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "User id is required."],
    },
    rematch_game_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "games",
      required: false,
    },
    game_name: {
      type: String,
      required: [true, "Game name is required."],
    },
    players: {
      type: Number,
      required: [true, "Players is required."],
    },
    rounds: {
      type: Number,
      default: null,
      required: [true, "Rounds is required."],
    },
    rule_type: {
      type: String,
      enum: ["judge", "party_rules"],
      default: "judge",
    },
    game_type: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    invited_members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    game_code: {
      type: Number,
      required: false,
    },
    game_sequence_id: {
      type: Number,
      default: 1,
    },
    players_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    exit_players_ids: [
      // this one is when user leave from the game then push there
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    sudden_death_players_ids: [
      // the ids of player who have same score(draw) and who playing the sudden death round
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    current_round: {
      type: Number,
      default: 0,
    },
    current_round_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "round_details",
    },
    current_round_judge_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    all_judge_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    game_status: {
      type: String,
      enum: ["waiting", "in_progress", "completed"],
      default: "waiting",
    },
    rematch_count: {
      type: Number,
      default: 0,
    },
    rematch_users_count: {
      type: Number,
      default: 0,
    },
    rematch_users_id: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    clue_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "clues",
      },
    ],
    win_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
    is_sudden_death: {
      type: Boolean,
      enum: [true, false],
      default: false, // true-this match is
    },
    is_current_round_switch: {
      type: Boolean,
      enum: [true, false],
      default: false, // true - switchRound call for current round
    },
    is_winner_declared: {
      type: Boolean,
      enum: [true, false],
      default: false, // true-full match winner declared - once called selectWinPlayer
    },
    is_rematch_happend: {
      type: Boolean,
      enum: [true, false],
      default: false, // true-this match have another child rematch
    },
    is_rematch: {
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

module.exports = mongoose.model("games", gameSchema);
