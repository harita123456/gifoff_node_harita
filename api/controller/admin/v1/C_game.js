const {
  successRes,
  errorRes,
  multiSuccessRes,
} = require("../../../../utils/common_fun");
const users = require("../../../models/M_user");
const user_session = require("../../../models/M_user_session");
const games = require("../../../models/M_games");
const leaderboard = require("../../../models/M_leaderboard");
const {
  notificationSend,
  notiSendMultipleDevice,
} = require("../../../../utils/notification_send");

const { dateTime } = require("../../../../utils/date_time");
const { sendOtpCode } = require("../../../../utils/send_mail");
const { userToken } = require("../../../../utils/token");

const fs = require("fs");
var nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const { countDocuments } = require("../../../models/M_chat");
const ObjectId = require("mongodb").ObjectId;

const gameList = async (req, res) => {
  try {
    var { game_type } = req.body;

    var findMatch = await games
      .find({
        is_deleted: false,
        // game_status: { $in: ["waiting", "in_progress"] },
        game_type: game_type,
      })
      .populate({
        path: "user_id",
        select: "name profile_picture profile_url is_block",
      })
      .populate({
        path: "players_ids",
        select: "name profile_picture profile_url is_block",
      })
      .sort({ createdAt: -1 });
    // .select("game_name game_sequence_id game_status")

    findMatch = await Promise.all(
      findMatch.map(async (data) => {
        var find_leaderboard = await leaderboard
          .find({ game_id: data?._id, is_deleted: false })
          .populate({
            path: "user_id",
            select: "name profile_picture profile_url is_block",
          });
        const update = {
          ...data.toObject(),
          leaderboard_data: find_leaderboard,
        };
        return update;
      })
    );

    findMatch?.forEach((value) => {
      if (
        value?.user_id?.profile_picture &&
        !value?.user_id?.profile_picture.startsWith(process.env.BASE_URL)
      ) {
        value.user_id.profile_picture =
          process.env.BASE_URL + value.user_id.profile_picture;
      }
      if (value?.players_ids) {
        value?.players_ids?.map((data) => {
          if (
            data?.profile_picture &&
            !data?.profile_picture.startsWith(process.env.BASE_URL)
          ) {
            data.profile_picture = process.env.BASE_URL + data.profile_picture;
          }
        });
      }

      if (value?.leaderboard_data) {
        value?.leaderboard_data?.map((data) => {
          if (
            data?.user_id?.profile_picture &&
            !data?.user_id?.profile_picture.startsWith(process.env.BASE_URL)
          ) {
            data.user_id.profile_picture =
              process.env.BASE_URL + data.user_id.profile_picture;
          }
        });
      }
    });

    return successRes(res, "game list get successfully", findMatch);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal Server Error!");
  }
};

const getGamedetails = async (req, res) => {
  try {
    var { game_id } = req.body;

    var findMatch = await games
      .findById(game_id)
      .where({ is_deleted: false })
      .populate({
        path: "user_id",
        select: "name profile_picture profile_url is_block",
      })
      .populate({
        path: "players_ids",
        select: "name profile_picture profile_url is_block",
      })
      .populate({
        path: "win_user_id",
        select: "name profile_picture profile_url is_block",
      });

    if (!findMatch) {
      return errorRes(res, "Couldn't found game");
    }

    var find_leaderboard = await leaderboard
      .find({ game_id: game_id, is_deleted: false })
      .populate({
        path: "user_id",
        select: "name profile_picture profile_url is_block",
      });

    findMatch = {
      ...findMatch._doc,
      leaderboard_data: find_leaderboard,
    };

    if (findMatch.user_id?.profile_picture) {
      findMatch.user_id.profile_picture =
        process.env.BASE_URL + findMatch.user_id?.profile_picture;
    }
    findMatch?.players_ids?.map(async (value) => {
      if (value.profile_picture) {
        value.profile_picture = process.env.BASE_URL + value.profile_picture;
      }
    });
    findMatch?.leaderboard_data?.map(async (value) => {
      if (value?.user_id?.profile_picture) {
        value.user_id.profile_picture =
          process.env.BASE_URL + value.user_id.profile_picture;
      }
    });
    if (findMatch.win_user_id?.profile_picture) {
      findMatch.win_user_id.profile_picture =
        process.env.BASE_URL + findMatch.win_user_id?.profile_picture;
    }
    return successRes(res, `Game details get successfully`, findMatch);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal Server Error!");
  }
};

const deleteGame = async (req, res) => {
  try {
    var { game_id } = req.body;

    var find_game = await games.findById(game_id);

    if (!find_game) {
      return errorRes(res, "Could't found game");
    }

    await games.findByIdAndUpdate(
      game_id,
      { $set: { is_deleted: true } },
      {
        new: true,
      }
    );
    return successRes(res, `Game deleted successfully`, []);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal Server Error!");
  }
};

const usergameList = async (req, res) => {
  try {
    var { user_id } = req.body;

    var find_user = await users.findOne({
      user_id: user_id,
      is_deleted: false,
    });

    if (!find_user) {
      return errorRes(res, "Could't found user");
    }

    var find_game = await games
      .find({
        user_id: user_id,
        // game_type: game_type,
        is_deleted: false,
      })
      .populate({
        path: "user_id",
        select: "name profile_picture profile_url is_block",
      })
      .populate({
        path: "players_ids",
        select: "name profile_picture profile_url is_block",
      });

    find_game = await Promise.all(
      find_game.map(async (data) => {
        var find_leaderboard = await leaderboard
          .find({ game_id: data?._id, is_deleted: false })
          .populate({
            path: "user_id",
            select: "name profile_picture profile_url is_block",
          });
        const update = {
          ...data.toObject(),
          leaderboard_data: find_leaderboard,
        };

        return update;
      })
    );

    find_game?.forEach((value) => {
      if (
        value?.user_id?.profile_picture &&
        !value?.user_id?.profile_picture.startsWith(process.env.BASE_URL)
      ) {
        value.user_id.profile_picture =
          process.env.BASE_URL + value.user_id.profile_picture;
      }
      if (value?.players_ids) {
        value?.players_ids?.map((data) => {
          if (
            data?.profile_picture &&
            !data?.profile_picture.startsWith(process.env.BASE_URL)
          ) {
            data.profile_picture = process.env.BASE_URL + data.profile_picture;
          }
        });
      }

      if (value?.leaderboard_data) {
        value?.leaderboard_data?.map((data) => {
          if (
            data?.user_id?.profile_picture &&
            !data?.user_id?.profile_picture.startsWith(process.env.BASE_URL)
          ) {
            data.user_id.profile_picture =
              process.env.BASE_URL + data.user_id.profile_picture;
          }
        });
      }
    });

    var find_game_count = await games.countDocuments({
      user_id: user_id,
      is_deleted: false,
    });
    return multiSuccessRes(
      res,
      "User game list get successfully",
      find_game,
      find_game_count
    );
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal Server Error!");
  }
};

module.exports = {
  gameList,
  getGamedetails,
  deleteGame,
  usergameList,
};
