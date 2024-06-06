const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const leaderboardSchema = new Schema(
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
    win_count: {
      type: Number,
      default: 0,
    },
    is_win_game: {
      type: Boolean,
      default: false, // true - that user is winner of that round
    },
    is_sudden_death: {
      type: Boolean,
      default: false, // true - that user is suddent death due to other user's draw
    },
    is_deleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("leaderboard", leaderboardSchema);
