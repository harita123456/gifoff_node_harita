const users = require("../../api/models/M_user");
const user_session = require("../../api/models/M_user_session");
const games = require("../../api/models/M_games");
// const categories = require("../../api/models/M_categories");
const clues = require("../../api/models/M_clues");
const round_submission = require("../../api/models/M_round_submission");
const round_details = require("../../api/models/M_round_details");
const leaderboard = require("../../api/models/M_leaderboard");
const game_chat = require("../../api/models/M_chat");
const quickChat = require("../../api/models/M_quickchat");
// const friends = require("../../api/models/M_friends");
// const request = require("../../api/models/M_request");

const {
  // notificationSend,
  notiSendMultipleDevice,
} = require("../../utils/notification_send");

const { socketSuccessRes, socketErrorRes } = require("../../utils/common_fun");

const { dateTime } = require("../../utils/date_time");

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
// const { log } = require("console");
const outputPath = path.join(__dirname, "../../");

const gameLocks = {};

// const { sFindSessionData } = require("../../api/v1/user/service");

module.exports = {
  createMatch: async (data) => {
    let {
      user_id,
      game_name,
      players,
      rounds,
      rule_type,
      game_type,
      invited_members,
    } = data;
    // console.log("data===========", data);

    // let game_code = Math.floor(100000 + Math.random() * 900000);

    var createData = {
      user_id,
      game_name,
      players,
      rounds,
      rule_type,
    };

    if (game_type && game_type == "private") {
      createData = { ...createData, game_type: game_type };

      if (invited_members) {
        createData = { ...createData, invited_members: invited_members };
      }
    }

    let selectGame = await games.findOne().sort({ createdAt: -1 });

    if (selectGame) {
      createData = {
        ...createData,
        game_sequence_id: selectGame.game_sequence_id + 1,
      };
    }

    let createGame = await games.create(createData);

    // send push notification to invited frinds
    if (invited_members) {
      let get_user = await users.findById(user_id);

      let noti_msg =
        get_user?.name + " has sent an game invitation to you for " + game_name;
      let noti_title = "Game play invitation";
      let noti_for = "game_invitation";
      let noti_image = get_user.profile_picture
        ? process.env.BASE_URL + get_user.profile_picture
        : get_user.profile_url;

      let notiData = {
        noti_image,
        noti_msg,
        noti_title,
        noti_for,
        id: createGame._id,
      };

      var device_token_array = [];

      const promises = invited_members.map(async (element) => {
        let find_token = await user_session.find({
          user_id: element,
          is_deleted: false,
        });
        for (var value of find_token) {
          var device_token = value.device_token;
          device_token_array.push(device_token);
        }
        return device_token_array;
      });

      await Promise.all(promises);

      if (device_token_array.length > 0) {
        notiData = { ...notiData, device_token: device_token_array };
        await notiSendMultipleDevice(notiData);
      }
    }

    return createGame;
  },

  matchList: async (data) => {
    var { user_id } = data;

    let where_cond = {
      is_deleted: false,
      game_status: { $in: ["waiting", "in_progress"] },
      game_type: "public",
    };

    var findMatch = await games
      .find(where_cond)
      .select(
        "game_name game_sequence_id game_status players players_ids game_type invited_members rematch_game_id"
      )
      .sort({ createdAt: -1 });

    var res_data = await Promise.all(
      findMatch.map(async (value, res) => {
        // transfer amount to hired provider

        var findPlayerInMatch = await games
          .findById(value._id)
          .where({ is_deleted: false, players_ids: user_id });

        if (findPlayerInMatch) {
          value = { ...value._doc, is_joined: true };
        } else {
          value = { ...value._doc, is_joined: false };
        }

        return value;
      })
    );

    return res_data;
  },

  privatematchList: async (data) => {
    var { user_id } = data;

    let where_cond = {
      is_deleted: false,
      game_status: { $in: ["waiting", "in_progress"] },
      game_type: "private",
    };

    where_cond = {
      ...where_cond,
      $or: [
        { invited_members: user_id },
        {
          user_id: user_id,
        },
      ],
    };

    var findMatch = await games
      .find(where_cond)
      .select(
        "game_name game_sequence_id game_status players players_ids game_type invited_members rematch_game_id"
      )
      .sort({ createdAt: -1 });

    var res_data = await Promise.all(
      findMatch.map(async (value, res) => {
        // transfer amount to hired provider

        var findPlayerInMatch = await games
          .findById(value._id)
          .where({ is_deleted: false, players_ids: user_id });

        if (findPlayerInMatch) {
          value = { ...value._doc, is_joined: true };
        } else {
          value = { ...value._doc, is_joined: false };
        }

        return value;
      })
    );

    return res_data;
  },

  matchDetails: async (data) => {
    var { game_id } = data;

    var findMatch = await games
      .findById(game_id)
      .where({ is_deleted: false })
      .populate({
        path: "players_ids",
        select: "name profile_picture profile_url is_block membership_type",
      })
      .populate({
        path: "current_round_id",
        // populate: { path: "clue_id", select: "clue_name" },
      });

    if (findMatch) {
      findMatch.players_ids.map(async (value) => {
        if (value.profile_picture) {
          value.profile_picture = value.profile_picture
            ? process.env.BASE_URL + value.profile_picture
            : value.profile_url;
        }
      });

      // attach clue details for rejoin users
      let find_clue = await clues
        .findById(findMatch.current_round_id?.clue_id)
        .populate({
          path: "category_id",
          select: "category_name description category_image",
        });

      if (find_clue?.category_id?.category_image) {
        find_clue.category_id.category_image =
          process.env.BASE_URL + find_clue.category_id.category_image;
      }

      findMatch = { ...findMatch._doc, clue_details: find_clue };

      // attach reveal details for rejoin users

      let get_data = await round_submission
        .find({
          game_id: game_id,
          round: findMatch.current_round_id?.round,
          is_deleted: false,
        })
        .populate({
          path: "user_id",
          select: "name profile_picture profile_url is_block membership_type",
        });

      if (get_data.length > 0) {
        get_data.map(async (value) => {
          if (value.is_url == false) {
            value.gif_name = process.env.BASE_URL + value.gif_name;
          }

          if (value.user_id?.profile_picture) {
            value.user_id.profile_picture =
              process.env.BASE_URL + value.user_id?.profile_picture;
          }
        });

        findMatch = { ...findMatch, reveal_details: get_data };
      }

      // attach winner data

      let find_win = await leaderboard
        .findOne()
        .where({ game_id: game_id, is_win_game: true, is_deleted: false })
        .populate({
          path: "user_id",
          select: "name profile_picture profile_url is_block membership_type",
        });

      if (find_win) {
        // check draw user
        let find_win_draw = await leaderboard
          .find()
          .where({ game_id: game_id, win_count: find_win.win_count })
          .populate({
            path: "user_id",
            select: "name profile_picture profile_url is_block membership_type",
          });

        if (find_win_draw.length > 1) {
          // here - manage futher process or event if needed to send server

          find_win_draw.map(async (value) => {
            if (value.user_id?.profile_picture) {
              value.user_id.profile_picture =
                process.env.BASE_URL + value.user_id?.profile_picture;
            }
          });

          var result_array = find_win_draw;
        } else {
          if (find_win.user_id?.profile_picture) {
            find_win.user_id.profile_picture =
              process.env.BASE_URL + find_win.user_id?.profile_picture;
          }

          var result_array = [];
          result_array.push(find_win);
        }

        findMatch = { ...findMatch, winner_details: result_array };
      }

      // attch leaderboard data

      let leaderboard_data = await leaderboard
        .find({
          game_id: game_id,
          is_deleted: false,
        })
        .populate({
          path: "user_id",
          select: "name profile_picture profile_url is_block membership_type",
        })
        .sort({ win_count: -1 });

      if (leaderboard_data.length > 0) {
        leaderboard_data.map(async (value) => {
          if (value.user_id?.profile_picture) {
            value.user_id.profile_picture =
              process.env.BASE_URL + value.user_id?.profile_picture;
          }
        });

        findMatch = { ...findMatch, leaderboard_data: leaderboard_data };
      }

      return findMatch;
    } else {
      return null;
    }
  },

  joinMatch: async (data) => {
    var { game_id, user_id, socket_data } = data;

    const user = await users.findOne({ _id: user_id, is_deleted: false });
    if (user) {
      await users.findByIdAndUpdate(
        { _id: user_id },
        {
          $set: {
            socket_id: socket_data,
          },
        },
        { new: true }
      );
    }

    // var findMatch = await games.findById(game_id).where({ is_deleted: false });

    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    // Find the game and lock the document
    const findMatch = await games
      .findById(game_id)
      .where({ is_deleted: false })
      .session(session)
      .exec();

    if (
      findMatch.players_ids.length == findMatch.players &&
      !findMatch.players_ids.includes(user_id)
    ) {
      // If maximum players reached, abort transaction
      await session.abortTransaction();
      session.endSession();
      var res_data = await socketErrorRes(
        "You can't join this game because there is no more player required"
      );
      return res_data;
    }

    var findPlayerInMatch = await games
      .findById(game_id)
      .where({
        is_deleted: false,
        players_ids: user_id,
      })
      .populate({
        path: "players_ids",
        select: "name profile_picture profile_url is_block membership_type",
      })
      .populate({
        path: "current_round_id",
      });

    var findExistingPlayerInMatch = await games
      .findById(game_id)
      .where({
        is_deleted: false,
        exit_players_ids: user_id,
      })
      .populate({
        path: "players_ids",
        select: "name profile_picture profile_url is_block membership_type",
      })
      .populate({
        path: "current_round_id",
      });

    if (!findMatch.players_ids.includes(user_id)) {
      // Add the player to the game
      findMatch.players_ids.push(user_id);
      await findMatch.save({ session: session });
    }

    // if existing player join again then remove from  exit_players_ids
    if (findMatch.exit_players_ids?.includes(user_id)) {
      // Add the player to the game
      findMatch.exit_players_ids.pull(user_id);
      await findMatch.save({ session: session });
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    if (findMatch) {
      if (findMatch.game_status == "completed") {
        var res_data = await socketErrorRes(
          "You can't join this game because it's completed"
        );

        return res_data;
      } else {
        if (findPlayerInMatch) {
          findPlayerInMatch.players_ids.map(async (value) => {
            if (value.profile_picture) {
              value.profile_picture = value.profile_picture
                ? process.env.BASE_URL + value.profile_picture
                : value.profile_url;
            }
          });

          var res_data = await socketSuccessRes(
            "You already joined this game",
            findPlayerInMatch
          );
          return res_data;
        } else if (findExistingPlayerInMatch) {
          if (findMatch.game_status == "completed") {
            var res_data = await socketErrorRes(
              "You can't join this game because it's completed"
            );

            return res_data;
          } else {
            // when existing player join the game again after exit game

            // add member in current round here oko

            let round_details_data_check = await round_details
              .findById(findExistingPlayerInMatch.current_round_id?._id)
              .where({ players_ids: user_id });

            if (!round_details_data_check) {
              await round_details.findByIdAndUpdate(
                findExistingPlayerInMatch.current_round_id?._id,
                {
                  $push: { players_ids: user_id },
                }
              );
            }

            var findExistingPlayerInMatchData = await games
              .findById(game_id)
              .where({
                is_deleted: false,
              })
              .populate({
                path: "players_ids",
                select:
                  "name profile_picture profile_url is_block membership_type",
              })
              .populate({
                path: "current_round_id",
              });

            findExistingPlayerInMatchData.players_ids.map(async (value) => {
              if (value.profile_picture) {
                value.profile_picture = value.profile_picture
                  ? process.env.BASE_URL + value.profile_picture
                  : value.profile_url;
              }
            });

            // check all user submitted their res

            let get_all_data = await round_submission
              .find({
                game_id: game_id,
                round: findMatch.current_round,
                is_deleted: false,
              })
              .countDocuments();

            var is_all_submitted = false;

            if (get_all_data == findMatch.players_ids.length - 1) {
              is_all_submitted = true;
            }

            // for sudden death

            if (findMatch.is_sudden_death == true) {
              if (get_all_data == findMatch.sudden_death_players_ids.length) {
                is_all_submitted = true;
              }
            }

            findExistingPlayerInMatchData = {
              ...findExistingPlayerInMatchData._doc,
              is_all_submitted,
            };

            var res_data = await socketSuccessRes(
              "You are successfully joined in this game",
              findExistingPlayerInMatchData
            );

            return res_data;
          }
        } else {
          if (findMatch.game_status == "in_progress") {
            var res_data = await socketErrorRes(
              "You can't join the game because it has already started"
            );
            return res_data;
          } else if (findMatch.game_status == "completed") {
            var res_data = await socketErrorRes(
              "You can't join this game because it's completed"
            );

            return res_data;
          } else {
            var checkPlayers = await games.findById(game_id).where({
              players_ids: user_id,
            });

            if (!checkPlayers) {
              var updateMatch = await games
                .findByIdAndUpdate(
                  game_id,
                  {
                    $push: { players_ids: user_id },
                  },
                  { new: true }
                )
                .populate({
                  path: "players_ids",
                  select:
                    "name profile_picture profile_url is_block membership_type",
                });
            } else {
              var updateMatch = await games
                .findById(game_id)
                .where({ is_deleted: false, players_ids: user_id })
                .populate({
                  path: "players_ids",
                  select:
                    "name profile_picture profile_url is_block membership_type",
                });
            }

            // console.log("updateMatch++++++++++++++++++",updateMatch)
            updateMatch.players_ids.map(async (value) => {
              if (value.profile_picture) {
                value.profile_picture = value.profile_picture
                  ? process.env.BASE_URL + value.profile_picture
                  : value.profile_url;
              }
            });

            // check all user submitted their res

            let get_all_data = await round_submission
              .find({
                game_id: game_id,
                round: findMatch.current_round,
                is_deleted: false,
              })
              .countDocuments();

            let is_all_submitted = false;

            if (get_all_data == findMatch.players_ids.length - 1) {
              is_all_submitted = true;
            }

            // for sudden death

            if (findMatch.is_sudden_death == true) {
              if (get_all_data == findMatch.sudden_death_players_ids.length) {
                is_all_submitted = true;
              }
            }

            updateMatch = { ...updateMatch._doc, is_all_submitted };

            var res_data = await socketSuccessRes(
              "You are successfully joined in this game",
              updateMatch
            );
            return res_data;
          }
        }
      }
    } else {
      var res_data = await socketErrorRes("Game not found");
      return res_data;
    }
  },

  startMatch: async (data) => {
    var { game_id, user_id } = data;

    var findMatch = await games.findById(game_id).where({ is_deleted: false });

    if (findMatch) {
      if (findMatch.game_status == "in_progress") {
        var res_data = await socketErrorRes("The game has already started");
        return res_data;
      } else if (findMatch.game_status == "completed") {
        var res_data = await socketErrorRes("The game is already completed");
        return res_data;
      } else if (findMatch.user_id.toString() != user_id) {
        var res_data = await socketErrorRes("You can't start this game");
        return res_data;
      } else if (findMatch.players_ids.length < process.env.MINIMUM_PLAYER) {
        var res_data = await socketErrorRes(
          "You can't start this game because the minimum limit of player for start the game is " +
            process.env.MINIMUM_PLAYER
        );
        return res_data;
      } else {
        var update_data = {
          game_status: "in_progress",
          current_round: findMatch.current_round + 1,
        };

        // select judge from here
        /* if (findMatch.rule_type == "party_rules") {
          var players_count = findMatch.players_ids.length - 1;
          const randomNumber = Math.floor(Math.random() * players_count) + 1;
          console.log("randomNumber-->> ", randomNumber - 1);

          var selected_judge = findMatch.players_ids[randomNumber - 1];

          console.log({ selected_judge });

          update_data = {
            ...update_data,
            current_round_judge_id: selected_judge,
          };

          var push_data = { all_judge_ids: selected_judge };

          var judge_id = selected_judge;
        } else {
          update_data = {
            ...update_data,
            current_round_judge_id: findMatch.user_id,
          };

          var push_data = { all_judge_ids: findMatch.user_id };

          var judge_id = findMatch.user_id;
        } */

        var players_count = findMatch.players_ids.length - 1;
        const randomNumber = Math.floor(Math.random() * players_count) + 1;
        console.log("randomNumber-->> ", randomNumber - 1);

        var selected_judge = findMatch.players_ids[randomNumber - 1];

        console.log({ selected_judge });

        update_data = {
          ...update_data,
          current_round_judge_id: selected_judge,
        };

        var push_data = { all_judge_ids: selected_judge };
        var updateMatch = await games
          .findByIdAndUpdate(
            game_id,
            {
              $set: update_data,
              $push: push_data,
            },
            { new: true }
          )
          .populate({
            path: "players_ids",
            select: "name profile_picture profile_url is_block membership_type",
          });

        updateMatch.players_ids.map(async (value) => {
          if (value.profile_picture) {
            value.profile_picture = value.profile_picture
              ? process.env.BASE_URL + value.profile_picture
              : value.profile_url;
          }

          // create - new

          // await leaderboard.create({
          //   user_id: value._id,
          //   game_id: game_id,
          // });

          let filter = {
            user_id: value._id,
            game_id: game_id,
          };

          let updateDoc = {
            user_id: value._id,
            game_id: game_id,
          };

          await leaderboard.updateOne(
            filter,
            { $set: updateDoc },
            { upsert: true }
          );
        });

        var res_data = await socketSuccessRes(
          "Game is started now",
          updateMatch
        );
        return res_data;
      }
    } else {
      var res_data = await socketErrorRes("Game not found");
      return res_data;
    }
  },

  generateClue: async (data) => {
    var { game_id, category_id } = data;

    var findMatch = await games.findById(game_id).where({ is_deleted: false });

    if (findMatch) {
      if (findMatch.game_status == "waiting") {
        var res_data = await socketErrorRes(
          "The game has been waiting for other player"
        );
        return res_data;
      } else if (findMatch.game_status == "completed") {
        var res_data = await socketErrorRes("The game is already completed");
        return res_data;
      } else {
        var clue_list_count = await clues
          .find({
            is_deleted: false,
            category_id: new mongoose.Types.ObjectId(category_id),
            _id: { $nin: findMatch.clue_ids }, // set condition for one time used clue not repeat in same game
          })
          .count();

        console.log("clue_list_count-->>", clue_list_count);

        if (clue_list_count > 0) {
          clue_list_count = clue_list_count - 1;
          const randomNumber = Math.floor(Math.random() * clue_list_count) + 1;
          console.log("randomNumber-->> ", randomNumber - 1);

          const find_clue = await clues
            .findOne({
              is_deleted: false,
              category_id: new mongoose.Types.ObjectId(category_id),
              _id: { $nin: findMatch.clue_ids }, // set condition for one time used clue not repeat in same game
            })
            .populate({
              path: "category_id",
              select: "category_name description category_image",
            })
            .skip(randomNumber - 1);

          if (find_clue?.category_id?.category_image) {
            find_clue.category_id.category_image =
              process.env.BASE_URL + find_clue.category_id.category_image;
          }

          // create round details - new

          let create_round_details = await round_details.create({
            game_id: game_id,
            judge_id: findMatch.current_round_judge_id,
            category_id: category_id,
            clue_id: find_clue._id,
            round: findMatch.current_round,
            players_ids: findMatch.players_ids,
            round_status: "in_progress",
          });

          await games.findByIdAndUpdate(game_id, {
            $set: { current_round_id: create_round_details._id },
            $push: { clue_ids: find_clue._id },
          });

          var res_data = await socketSuccessRes(
            "Clue generated successfully",
            find_clue
          );
          return res_data;
        } else {
          console.log("else calling.......");
          var all_clue_list_count = await clues
            .find({
              is_deleted: false,
              category_id: new mongoose.Types.ObjectId(category_id),
              // _id: { $nin: findMatch.clue_ids }, // set condition for one time used clue not repeat in same game
            })
            .count();

          if (all_clue_list_count > 0) {
            all_clue_list_count = all_clue_list_count - 1;
            const randomNumber =
              Math.floor(Math.random() * all_clue_list_count) + 1;
            console.log("randomNumber-->> ", randomNumber - 1);

            const find_clue = await clues
              .findOne({
                is_deleted: false,
                category_id: new mongoose.Types.ObjectId(category_id),
                // _id: { $nin: findMatch.clue_ids }, // set condition for one time used clue not repeat in same game
              })
              .populate({
                path: "category_id",
                select: "category_name description category_image",
              })
              .skip(randomNumber - 1);

            if (find_clue?.category_id?.category_image) {
              find_clue.category_id.category_image =
                process.env.BASE_URL + find_clue.category_id.category_image;
            }

            // create round details - new

            let create_round_details = await round_details.create({
              game_id: game_id,
              judge_id: findMatch.current_round_judge_id,
              category_id: category_id,
              clue_id: find_clue._id,
              round: findMatch.current_round,
              players_ids: findMatch.players_ids,
              round_status: "in_progress",
            });

            await games.findByIdAndUpdate(game_id, {
              $set: { current_round_id: create_round_details._id },
              $push: { clue_ids: find_clue._id },
            });

            var res_data = await socketSuccessRes(
              "Clue generated successfully",
              find_clue
            );
            return res_data;
          } else {
            var res_data = await socketErrorRes(
              "No clues are available in this category"
            );
            return res_data;
          }
        }
      }
    } else {
      var res_data = await socketErrorRes("Game not found");
      return res_data;
    }
  },

  submitGIF: async (data) => {
    var {
      game_id,
      gif_name,
      round,
      category_id,
      clue_id,
      user_id,
      is_url,
      is_extra_round,
    } = data;

    // console.log("submitGIF+++++++++", data);

    var findMatch = await games.findById(game_id).where({ is_deleted: false });

    if (findMatch) {
      if (round != findMatch.current_round) {
        var res_data = await socketErrorRes("The round was not found");
        return res_data;
      } else {
        let get_data = await round_submission.findOne({
          game_id: game_id,
          round: round,
          user_id: user_id,
          category_id: category_id,
          clue_id: clue_id,
          is_deleted: false,
        });

        console.log("before update", get_data);

        if (get_data) {
          //update

          const fileName = `${outputPath}public/${get_data.gif_name}`;

          if (
            fileName !== `${outputPath}public/gif_storage/Loser_Bright.gif` &&
            fileName !== `${outputPath}public/gif_storage/Loser_Dark.gif` &&
            get_data.is_url !== true
          ) {
            // Check if it's the file you want to keep
            await fs.unlink(fileName, (err) => {
              if (err) console.error(err); // Log errors for debugging
            });
          } else {
            console.log(`Skipping deletion of ${fileName}`); // Optional: Log the skipped file
          }

          var submit_gif = await round_submission.findByIdAndUpdate(
            get_data._id,
            {
              $set: {
                gif_name: gif_name,
                is_url: is_url,
              },
            },
            { new: true }
          );

          console.log("submit_gif", submit_gif);
        } else {
          createData = {
            game_id,
            gif_name,
            round,
            category_id,
            clue_id,
            user_id,
            is_url,
          };

          if (is_extra_round == true || is_extra_round == "true") {
            createData = {
              ...createData,
              is_extra_round: true,
            };
          }

          let submit_gif = await round_submission.create(createData);

          console.log("create_submit_gif", submit_gif);
        }

        var get_submit_gif = await round_submission
          .findById(submit_gif._id)
          .populate({
            path: "user_id",
            select: "name profile_picture profile_url is_block membership_type",
          });

        if (get_submit_gif?.user_id?.profile_picture) {
          get_submit_gif.user_id.profile_picture =
            process.env.BASE_URL + get_submit_gif.user_id.profile_picture;
        }

        if (gif_name.is_url == false) {
          get_submit_gif.gif_name =
            process.env.BASE_URL + get_submit_gif.gif_name;
        }

        // check all user submitted their res

        let get_all_data = await round_submission
          .find({
            game_id: game_id,
            round: round,
            is_deleted: false,
          })
          .countDocuments();

        var is_all_submitted = false;

        if (get_all_data == findMatch.players_ids.length - 1) {
          is_all_submitted = true;
        }

        // for sudden death

        if (findMatch.is_sudden_death == true) {
          if (get_all_data == findMatch.sudden_death_players_ids.length) {
            is_all_submitted = true;
          }
        }

        get_submit_gif = { ...get_submit_gif._doc, is_all_submitted };

        var res_data = await socketSuccessRes(
          "GIF submitted successfully",
          get_submit_gif
        );
        return res_data;
      }
    } else {
      var res_data = await socketErrorRes("Game not found");
      return res_data;
    }
  },

  sendMessage: async (data) => {
    let { game_id, user_id, message, message_type } = data;

    // console.log("sendMessage data ==> ", data);
    // console.log("==============================");

    var findMatch = await games.findById(game_id).where({ is_deleted: false });
    var find_user = await users
      .findById(user_id)
      .where({ is_deleted: false })
      .select("name profile_picture profile_url is_block membership_type");

    if (find_user?.profile_picture) {
      find_user.profile_picture =
        process.env.BASE_URL + find_user.profile_picture;
    }
    var receiver_array = [];
    findMatch.players_ids?.map((data) => {
      if (data && !data.equals(user_id)) {
        receiver_array.push(data);
      }
    });

    if (findMatch) {
      // if (findMatch.game_status == "completed") {
      //   var res_data = await socketErrorRes("The game is already completed");
      //   return res_data;
      // }
      //  else
      //   {
      let currentDateTime = await dateTime();

      let response_data = {
        game_id: game_id,
        user_id: find_user,
        message: message,
        message_time: currentDateTime,
      };

      let insertData = {
        game_id: game_id,
        user_id: user_id,
        receiver_ids: receiver_array,
        message_time: currentDateTime,
        message: message,
        message_type: message_type,
      };

      await game_chat.create(insertData);

      var res_data = await socketSuccessRes(
        "Message sent successfully",
        response_data
      );

      return res_data;
      // }
    } else {
      var res_data = await socketErrorRes("Game not found");
      return res_data;
    }
  },

  revealResult: async (data) => {
    const { game_id, round } = data;

    // Check if there's already a lock for this game
    if (gameLocks[game_id]) {
      console.log(`Game ${game_id} is already being processed`);
      return null;
    }

    // Set the lock
    gameLocks[game_id] = true;

    try {
      console.log("data+++++++++++", data);

      const findMatch = await games
        .findById(game_id)
        .where({ is_deleted: false });
      console.log("findMatch++--++--", findMatch);

      if (!findMatch) {
        const res_data = await socketErrorRes("Game not found");
        return res_data;
      }

      if (round != findMatch.current_round) {
        const res_data = await socketErrorRes("The round was not found");
        return res_data;
      }

      findMatch.is_current_round_switch = false;
      await findMatch.save();

      const round_details_data = await round_details.findOne({
        game_id: game_id,
        round: round,
        is_deleted: false,
      });

      if (round_details_data?.is_reveal_result == false) {
        await round_details.findByIdAndUpdate(
          round_details_data._id,
          {
            $set: { is_reveal_result: true },
          },
          { new: true }
        );

        const strings = ["Loser_Bright.gif", "Loser_Dark.gif"];
        const randomIndex = Math.floor(Math.random() * strings.length);
        const randomString = strings[randomIndex];

        await Promise.all(
          round_details_data?.players_ids?.map(async (value) => {
            if (
              value.toString() != findMatch.current_round_judge_id.toString()
            ) {
              if (findMatch.is_sudden_death) {
                if (findMatch?.sudden_death_players_ids.includes(value)) {
                  const find_round = await round_submission.findOne({
                    game_id: game_id,
                    round: round,
                    user_id: value,
                    is_deleted: false,
                  });

                  if (!find_round) {
                    const createData = {
                      game_id: game_id,
                      round: round,
                      category_id: round_details_data.category_id,
                      clue_id: round_details_data.clue_id,
                      user_id: value,
                      gif_name: `gif_storage/${randomString}`,
                    };
                    await round_submission.create([createData]);
                  }
                }
              } else {
                const find_round = await round_submission.findOne({
                  game_id: game_id,
                  round: round,
                  user_id: value,
                  is_deleted: false,
                });

                if (!find_round) {
                  const createData = {
                    game_id: game_id,
                    round: round,
                    category_id: round_details_data.category_id,
                    clue_id: round_details_data.clue_id,
                    user_id: value,
                    gif_name: `gif_storage/${randomString}`,
                  };
                  await round_submission.create([createData]);
                }
              }
            }
          })
        );

        const get_data = await round_submission.find({
          game_id: game_id,
          round: round,
          is_deleted: false,
        });
        get_data.forEach((value) => {
          if (value.is_url == false) {
            value.gif_name = process.env.BASE_URL + value.gif_name;
          }
        });

        const res_data = await socketSuccessRes(
          "Result reveal successful",
          get_data
        );
        return res_data;
      } else {
        console.log("returning null ---");
        return null;
      }
    } catch (error) {
      console.error("Error in revealResult event:", error);

      const res_data = await socketErrorRes("Something went wrong!");
      return res_data;
    } finally {
      // Release the lock
      delete gameLocks[game_id];
    }
  },

  // before game lock
  /*  revealResult: async (data) => {
    var { game_id, round, user_id } = data;

    try {
      console.log("data+++++++++++", data);

      var findMatch = await games
        .findById(game_id)
        .where({ is_deleted: false });

      console.log("findMatch++--++--", findMatch);

      if (findMatch) {
        if (round != findMatch.current_round) {
          var res_data = await socketErrorRes("The round was not found");
          return res_data;
        }
        // else if (user_id != findMatch.current_round_judge_id.toString()) {
        //   var res_data = await socketErrorRes(
        //     "You have no access for reveal result for this round"
        //   );
        //   return res_data;
        // }
        else {
          // update game switch round status

          findMatch.is_current_round_switch = false;
          // await findMatch.save({ session: session });
          await findMatch.save();

          let round_details_data = await round_details.findOne({
            game_id: game_id,
            round: round,
            is_deleted: false,
          });

          if (round_details_data?.is_reveal_result == false) {
            // Use findByIdAndUpdate with session option to update is_reveal_result field
            let up_data = await round_details.findByIdAndUpdate(
              round_details_data._id,
              { $set: { is_reveal_result: true } },
              { new: true }
            );

            // Rest of your logic to create round data and handle reveal result goes here

            const strings = ["Loser_Bright.gif", "Loser_Dark.gif"];
            const randomIndex = Math.floor(Math.random() * strings.length);
            const randomString = strings[randomIndex];

            var round_data = await Promise.all(
              round_details_data?.players_ids?.map(async (value) => {
                if (
                  value.toString() !=
                  findMatch.current_round_judge_id.toString()
                ) {
                  // here replaced user_id to current_round_judge_id
                  if (findMatch.is_sudden_death == true) {
                    if (findMatch?.sudden_death_players_ids.includes(value)) {
                      console.log("if work");
                      var find_round = await round_submission.findOne({
                        game_id: game_id,
                        round: round,
                        user_id: value,
                        is_deleted: false,
                      });

                      var find_round_all = await round_submission.findOne({
                        game_id: game_id,
                        round: round,
                        is_deleted: false,
                      });

                      console.log("find_round in if work", find_round);

                      if (!find_round) {
                        createData = {
                          game_id: game_id,
                          round: round, // Adding round field
                          category_id: round_details_data.category_id,
                          clue_id: round_details_data.clue_id,
                          user_id: value,
                          gif_name: `gif_storage/${randomString}`,
                        };
                        await round_submission.create([createData]); // Pass an array as the first argument
                      }
                    }
                  }
                  if (findMatch.is_sudden_death == false) {
                    console.log("else work");
                    var find_round = await round_submission.findOne({
                      game_id: game_id,
                      round: round, // Adding round field
                      user_id: value,
                      is_deleted: false,
                    });

                    console.log("find_round in else work", find_round);

                    var find_round_all = await round_submission.findOne({
                      game_id: game_id,
                      round: round,
                      is_deleted: false,
                    });

                    console.log("find_round in if work", find_round);

                    if (!find_round) {
                      createData = {
                        game_id: game_id,
                        round: round, // Adding round field
                        category_id: round_details_data.category_id,
                        clue_id: round_details_data.clue_id,
                        user_id: value,
                        gif_name: `gif_storage/${randomString}`,
                      };

                      await round_submission.create([createData]);
                    }
                  }
                }
              })
            );

            let get_data = await round_submission.find({
              game_id: game_id,
              round: round,
              is_deleted: false,
            });
            console.log("get_data check", get_data);
            get_data.map(async (value) => {
              if (value.is_url == false) {
                value.gif_name = process.env.BASE_URL + value.gif_name;
              }
            });

            var res_data = await socketSuccessRes(
              "Result reveal successful",
              get_data
            );
            return res_data;
          } else {
            console.log("returning null ---");
            return null;
          }
        }
      } else {
        var res_data = await socketErrorRes("Game not found");
        return res_data;
      }
    } catch (error) {
      // Handle or log the error
      console.error("Error in revealResult event:", error);

      // Return an error response
      let res_data = await socketErrorRes("Something went wrong!");
      return res_data;
    }
  }, */

  /* revealResult: async (data) => {
    var { game_id, round, user_id } = data;

    // Start a Mongoose session
    const session = await mongoose.startSession();

    try {
      // Start the transaction
      await session.startTransaction();

      console.log("data+++++++++++", data);

      var findMatch = await games
        .findById(game_id)
        .where({ is_deleted: false })
        .session(session);

      console.log("findMatch++--++--", findMatch);

      if (findMatch) {
        if (round != findMatch.current_round) {
          var res_data = await socketErrorRes("The round was not found");
          return res_data;
        }
        // else if (user_id != findMatch.current_round_judge_id.toString()) {
        //   var res_data = await socketErrorRes(
        //     "You have no access for reveal result for this round"
        //   );
        //   return res_data;
        // }
        else {
          let round_details_data = await round_details
            .findOne({ game_id: game_id, round: round, is_deleted: false })
            .session(session);

          console.log({ round_details_data });

          if (round_details_data?.is_reveal_result == false) {
            // Use findByIdAndUpdate with session option to update is_reveal_result field
            let up_data = await round_details.findByIdAndUpdate(
              round_details_data._id,
              { $set: { is_reveal_result: true } },
              { new: true, session: session }
            );

            // Rest of your logic to create round data and handle reveal result goes here

            const strings = ["Loser_Bright.gif", "Loser_Dark.gif"];
            const randomIndex = Math.floor(Math.random() * strings.length);
            const randomString = strings[randomIndex];

            var round_data = await Promise.all(
              round_details_data?.players_ids?.map(async (value) => {
                if (
                  value.toString() !=
                  findMatch.current_round_judge_id.toString()
                ) {
                  // here replaced user_id to current_round_judge_id
                  if (findMatch.is_sudden_death == true) {
                    if (findMatch?.sudden_death_players_ids.includes(value)) {
                      console.log("if work");
                      var find_round = await round_submission
                        .findOne({
                          game_id: game_id,
                          round: round,
                          user_id: value,
                          is_deleted: false,
                        })
                        .session(session);

                      console.log("find_round in if work", find_round);

                      if (!find_round) {
                        createData = {
                          game_id: game_id,
                          round: round, // Adding round field
                          category_id: round_details_data.category_id,
                          clue_id: round_details_data.clue_id,
                          user_id: value,
                          gif_name: `gif_storage/${randomString}`,
                        };
                        await round_submission.create([createData], {
                          session: session,
                        }); // Pass an array as the first argument
                      }
                    }
                  }
                  if (findMatch.is_sudden_death == false) {
                    console.log("else work");
                    var find_round = await round_submission
                      .findOne({
                        game_id: game_id,
                        round: round, // Adding round field
                        user_id: value,
                        is_deleted: false,
                      })
                      .session(session);

                    console.log("find_round in else work", find_round);
                    if (!find_round) {
                      createData = {
                        game_id: game_id,
                        round: round, // Adding round field
                        category_id: round_details_data.category_id,
                        clue_id: round_details_data.clue_id,
                        user_id: value,
                        gif_name: `gif_storage/${randomString}`,
                      };

                      await round_submission.create([createData], {
                        session: session,
                      });
                    }
                  }
                }
              })
            );

            // Commit the transaction
            var check = await session.commitTransaction();
            console.log("commitTransaction check", check);
            let get_data = await round_submission
              .find({ game_id: game_id, round: round, is_deleted: false })
              .session(session);
            console.log("get_data check", get_data);
            get_data.map(async (value) => {
              if (value.is_url == false) {
                value.gif_name = process.env.BASE_URL + value.gif_name;
              }
            });

            var res_data = await socketSuccessRes(
              "Result reveal successfull",
              get_data
            );
            return res_data;
          } else {
            console.log("returning null ---");
            return null;
          }
        }
      } else {
        var res_data = await socketErrorRes("Game not found");
        return res_data;
      }
    } catch (error) {
      // Handle or log the error
      console.error("Error in revealResult event:", error);

      // If the error is due to a write conflict, retry the operation
      if (error.code === 112) {
        console.log("Retrying operation...");
        // return await revealResult(data);
        return await revealResultRecall(data);
      } else {
        // If an error occurs during the transaction, abort it
        await session.abortTransaction();

        // End the session
        session.endSession();

        // Return an error response
        let res_data = await socketErrorRes("Something went wrong!");
        return res_data;
      }
    } finally {
      // End the session
      session.endSession();
    }
  }, */

  // before transaction
  /* revealResult: async (data) => {
    var { game_id, round, user_id } = data;

    console.log("data+++++++++++", data);

    var findMatch = await games.findById(game_id).where({ is_deleted: false });

    if (findMatch) {
      if (round != findMatch.current_round) {
        var res_data = await socketErrorRes("The round was not found");
        return res_data;
      } else if (user_id != findMatch.current_round_judge_id.toString()) {
        var res_data = await socketErrorRes(
          "You have no access for reveal result for this round"
        );
        return res_data;
      } else {
        // let get_data = await round_submission.find({
        //   game_id: game_id,
        //   round: round,
        //   is_deleted: false,
        // });
        let round_details_data = await round_details.findOne({
          game_id: game_id,
          round: round,
          is_deleted: false,
        });

        if (round_details_data.is_reveal_result == false) {
          if (round_details_data) {
            await round_details.findByIdAndUpdate(round_details_data._id, {
              $set: { is_reveal_result: true },
            });
          }

          // findMatch?.players_ids?.map(async (value) => {
          //   if (value.toString() != user_id.toString()) {
          //     var find_round = await round_submission.findOne({
          //       game_id: game_id,
          //       round: round,
          //       user_id: value,
          //       is_deleted: false,
          //     })
          //     if (!find_round) {
          //       createData = {
          //         game_id: game_id,
          //         gif_name: findMatch.game_name,
          //         round: round,
          //         category_id: round_details_data.category_id,
          //         clue_id: round_details_data.clue_id,
          //         user_id: value,
          //         gif_name: "gif_storage/Loser_Dark.gif"
          //       };
          //       var submit_gif = await round_submission.create(createData);
          //     }
          //   }
          // })
          const strings = ["Loser_Bright.gif", "Loser_Dark.gif"];
          const randomIndex = Math.floor(Math.random() * strings.length);
          const randomString = strings[randomIndex];

          // here merge leave and existing both players

          console.log(randomString);
          var round_data = await Promise.all(
            // findMatch?.players_ids?.map(async (value) => { // for existing user's not working
            round_details_data?.players_ids?.map(async (value) => {
              if (value.toString() != user_id.toString()) {
                if (findMatch.is_sudden_death == true) {
                  if (findMatch?.sudden_death_players_ids.includes(value)) {
                    console.log("if work");
                    var find_round = await round_submission.findOne({
                      game_id: game_id,
                      round: round,
                      user_id: value,
                      is_deleted: false,
                    });

                    if (!find_round) {
                      createData = {
                        game_id: game_id,
                        gif_name: findMatch.game_name,
                        round: round,
                        category_id: round_details_data.category_id,
                        clue_id: round_details_data.clue_id,
                        user_id: value,
                        gif_name: `gif_storage/${randomString}`,
                      };
                      await round_submission.create(createData);
                    }
                  }
                  // }
                }
                if (findMatch.is_sudden_death == false) {
                  console.log("else work");
                  var find_round = await round_submission.findOne({
                    game_id: game_id,
                    round: round,
                    user_id: value,
                    is_deleted: false,
                  });

                  if (!find_round) {
                    createData = {
                      game_id: game_id,
                      gif_name: findMatch.game_name,
                      round: round,
                      category_id: round_details_data.category_id,
                      clue_id: round_details_data.clue_id,
                      user_id: value,
                      gif_name: `gif_storage/${randomString}`,
                    };

                    await round_submission.create(createData);
                  }
                }
              }
            })
          );

          let get_data = await round_submission.find({
            game_id: game_id,
            round: round,
            is_deleted: false,
          });

          get_data.map(async (value) => {
            if (value.is_url == false) {
              value.gif_name = process.env.BASE_URL + value.gif_name;
            }
          });

          //   await Promise.all(get_data.map(async (value) => {
          //     if (value.is_url == false) {
          //         value.gif_name = process.env.BASE_URL + value.gif_name;
          //     }
          // }));
          var res_data = await socketSuccessRes(
            "Result reveal successfull",
            get_data
          );
          return res_data;
        } else {
          return null;
        }
      }
    } else {
      var res_data = await socketErrorRes("Game not found");
      return res_data;
    }
  }, */

  // before transaction
  /* selectWinGIF: async (data) => {
    var { game_id, round_submission_id, user_id } = data;

    if (!round_submission_id) {
      // select random winner from here

      let get_any_data = await round_submission.findOne({ is_deleted: false });

      var round_submission_id = get_any_data._id;

      // further multiple call concept set
    }

    var findMatch = await games
      .findById(game_id)
      .where({ is_deleted: false })
      .populate({
        path: "players_ids",
        select: "name profile_picture profile_url is_block",
      });

    if (findMatch) {
      if (user_id != findMatch.current_round_judge_id.toString()) {
        var res_data = await socketErrorRes(
          "You have no access for select winner for this round"
        );
        return res_data;
      } else {
        let get_data = await round_submission
          .findByIdAndUpdate(
            round_submission_id,
            { $set: { is_win: true } },
            { new: true }
          )
          .populate({
            path: "user_id",
            select: "name profile_picture profile_url is_block",
          });

        // get_data?.map(async (value) => {
        //   value.gif_name = process.env.BASE_URL + value.gif_name;
        // });

        if (get_data?.user_id?.profile_picture) {
          get_data.user_id.profile_picture =
            process.env.BASE_URL + get_data.user_id.profile_picture;
        }
        if (get_data?.is_url == false) {
          get_data.gif_name = process.env.BASE_URL + get_data.gif_name;
        }

        await leaderboard.findOneAndUpdate(
          { user_id: get_data.user_id, game_id: game_id },
          {
            $inc: {
              win_count: 1,
            },
          }
        );

        let find_win = await leaderboard
          .findOne()
          .where({ game_id: game_id })
          .sort({ win_count: -1 });

        if (find_win) {
          // set suddent death condition

          var leaderboard_update_data = {
            is_win_game: false,
          };

          var updateGameData = {
            win_user_id: find_win.user_id,
          };

          if (findMatch.rounds <= findMatch.current_round) {
            // check draw user
            let find_win_draw = await leaderboard
              .find()
              .where({ game_id: game_id, win_count: find_win.win_count });

            if (find_win_draw.length > 1) {
              // here - manage futher process or event if needed to send server

              var sudden_death_players_ids = [];

              find_win_draw.forEach((value) => {
                sudden_death_players_ids.push(value.user_id);
              });

              leaderboard_update_data = {
                ...leaderboard_update_data,
                is_sudden_death: true,
                sudden_death_players_ids,
              };
              updateGameData = {
                ...updateGameData,
                is_sudden_death: true,
                sudden_death_players_ids,
              };
            } else {
              updateGameData = {
                ...updateGameData,
                game_status: "completed",
              };
            }
          }

          // -----------------

          console.log("find_win.win_count----->>>>>", find_win.win_count);

          await leaderboard.updateMany(
            { game_id: game_id, win_count: { $ne: find_win.win_count } },
            {
              $set: leaderboard_update_data,
            }
          );

          await games.findByIdAndUpdate(game_id, {
            $set: updateGameData,
          });

          // await leaderboard.findByIdAndUpdate(find_win._id, {
          //   $set: {
          //     is_win_game: true,
          //   },
          // });

          await leaderboard.updateMany(
            { game_id: game_id, win_count: find_win.win_count },
            {
              $set: {
                is_win_game: true,
              },
            }
          );
        }

        // for rejoin manage

        if (findMatch.rounds == get_data.round) {
          await round_details.findByIdAndUpdate(findMatch.current_round_id, {
            $set: { round_status: "game_winner_selected" },
          });
        } else {
          await round_details.findByIdAndUpdate(findMatch.current_round_id, {
            $set: { round_status: "round_winner_selected" },
          });
        }

        let leaderboard_data = await leaderboard
          .find({
            game_id: game_id,
            is_deleted: false,
          })
          .populate({
            path: "user_id",
            select: "name profile_picture profile_url is_block",
          })
          .sort({ win_count: -1 });

        leaderboard_data.map(async (value) => {
          if (value.user_id?.profile_picture) {
            value.user_id.profile_picture =
              process.env.BASE_URL + value.user_id?.profile_picture;
          }
        });

        var send_result = {
          winner_data: get_data,
          leaderboard_data: leaderboard_data,
        };

        var res_data = await socketSuccessRes(
          "Winner declared successfully",
          send_result
        );

        console.log("res_data", res_data);
        return res_data;
      }
    } else {
      var res_data = await socketErrorRes("Game not found");
      return res_data;
    }
  }, */

  selectWinGIF: async (data) => {
    var { game_id, round_submission_id } = data;

    var is_reveal_call = false;

    // Start a Mongoose session
    const session = await mongoose.startSession();

    try {
      // Start the transaction
      await session.startTransaction();

      // Find the game
      var findMatch = await games
        .findById(game_id)
        .where({ is_deleted: false })
        .populate({
          path: "players_ids",
          select: "name profile_picture profile_url is_block membership_type",
        });

      // Check if the game exists
      if (findMatch) {
        // is_winner_declared here set it false because for sudden death win player calling again

        if (
          findMatch.is_sudden_death == true &&
          findMatch.is_winner_declared == true
        ) {
          await games.findByIdAndUpdate(game_id, {
            $set: { is_winner_declared: false },
          });
        }

        // Select random winner if round_submission_id is not provided
        if (!round_submission_id) {
          // let get_any_data = await round_submission.findOne({
          //   is_deleted: false,
          //   game_id: game_id,
          //   round: findMatch.current_round,
          // });

          let get_any_data = await round_submission.aggregate([
            {
              $match: {
                is_deleted: false,
                game_id: new mongoose.Types.ObjectId(game_id),
                round: findMatch.current_round,
              },
            },
            { $sample: { size: 1 } }, // This will randomly select one document
          ]);

          // Since aggregate returns an array, you need to extract the document
          get_any_data = get_any_data.length ? get_any_data[0] : null;

          if (get_any_data) {
            round_submission_id = get_any_data?._id;
          } else {
            console.log("here----- 11");
            return null;
          }

          is_reveal_call = true;
        }

        // check already win gif selected or not
        let get_win_data = await round_submission.find({
          is_deleted: false,
          game_id: game_id,
          round: findMatch.current_round,
          is_win: true,
        });

        console.log("-->>>>", findMatch.exit_players_ids);
        console.log(
          findMatch.exit_players_ids.includes(findMatch.current_round_judge_id)
        );

        console.log("iam --", round_submission_id);
        console.log("iam -- length", findMatch.exit_players_ids?.length);

        // if judge not leave still apply condition - after 30 sec call automatic winner - 10-5-2024 8:009PM cooment if and else if both
        // check judge is available or not

        // if (
        //   is_reveal_call == true &&
        //   (findMatch.exit_players_ids == undefined ||
        //     findMatch.exit_players_ids?.length <= 0)
        // ) {
        //   console.log("here----- 22");
        //   return null;
        // }
        // else if (
        //   is_reveal_call == true &&
        //   (get_win_data.length > 0 ||
        //     !findMatch.exit_players_ids?.includes(
        //       findMatch.current_round_judge_id
        //     ))
        // ) {
        //   console.log("here----- 33");
        //   return null;
        // }
        // else {
        // Check if the user is the judge for the current round
        // if (
        //   user_id &&
        //   user_id != findMatch.current_round_judge_id.toString()
        // ) {
        //   var res_data = await socketErrorRes(
        //     "You have no access for select winner for this round"
        //   );
        //   return res_data;
        // } else {
        // Update the winner status in the database

        if (get_win_data.length > 0) {
          console.log("Winner already declared -------------");
          return null;
        } else {
          let get_data = await round_submission
            .findByIdAndUpdate(
              round_submission_id,
              { $set: { is_win: true } },
              { new: true }
            )
            .populate({
              path: "user_id",
              select:
                "name profile_picture profile_url is_block membership_type",
            });

          // get_data?.map(async (value) => {
          //   value.gif_name = process.env.BASE_URL + value.gif_name;
          // });

          if (get_data?.user_id?.profile_picture) {
            get_data.user_id.profile_picture =
              process.env.BASE_URL + get_data.user_id.profile_picture;
          }
          if (get_data?.is_url == false) {
            get_data.gif_name = process.env.BASE_URL + get_data.gif_name;
          }

          await leaderboard.findOneAndUpdate(
            { user_id: get_data.user_id, game_id: game_id },
            {
              $inc: {
                win_count: 1,
              },
            }
          );

          let find_win = await leaderboard
            .findOne()
            .where({ game_id: game_id })
            .sort({ win_count: -1 });

          if (find_win) {
            // set suddent death condition

            var leaderboard_update_data = {
              is_win_game: false,
            };

            var updateGameData = {
              win_user_id: find_win.user_id,
            };

            if (findMatch.rounds <= findMatch.current_round) {
              // check draw user
              let find_win_draw = await leaderboard
                .find()
                .where({ game_id: game_id, win_count: find_win.win_count });

              if (find_win_draw.length > 1) {
                // here - manage futher process or event if needed to send server

                var sudden_death_players_ids = [];

                find_win_draw.forEach((value) => {
                  sudden_death_players_ids.push(value.user_id);
                });

                leaderboard_update_data = {
                  ...leaderboard_update_data,
                  is_sudden_death: true,
                  is_winner_declared: false, // because need to call again selectWinPlayer after sudden death
                  is_current_round_switch: false, // because need to call again switchRound after sudden death
                  sudden_death_players_ids,
                };
                updateGameData = {
                  ...updateGameData,
                  is_sudden_death: true,
                  is_winner_declared: false, // because need to call again selectWinPlayer after sudden death
                  is_current_round_switch: false, // because need to call again switchRound after sudden death
                  sudden_death_players_ids,
                };
              } else {
                updateGameData = {
                  ...updateGameData,
                  game_status: "completed",
                };

                // ==== unlink gif here

                // find all images of that game

                let get_gif_data = await round_submission.find({
                  game_id: game_id,
                });

                get_gif_data.map(async (value) => {
                  const fileName = `${outputPath}public/${value.gif_name}`;

                  if (
                    fileName !==
                      `${outputPath}public/gif_storage/Loser_Bright.gif` &&
                    fileName !==
                      `${outputPath}public/gif_storage/Loser_Dark.gif` &&
                    value.is_url !== true
                  ) {
                    // Check if it's the file you want to keep
                    await fs.unlink(fileName, (err) => {
                      if (err) console.error(err); // Log errors for debugging
                    });
                  } else {
                    console.log(`Skipping deletion of ${fileName}`); // Optional: Log the skipped file
                  }
                });
                //==========
              }
            }

            // -----------------

            console.log("find_win.win_count----->>>>>", find_win.win_count);

            await leaderboard.updateMany(
              { game_id: game_id, win_count: { $ne: find_win.win_count } },
              {
                $set: leaderboard_update_data,
              }
            );

            updateGameData = {
              ...updateGameData,
              is_current_round_switch: false,
            };

            await games.findByIdAndUpdate(game_id, {
              $set: updateGameData,
            });

            // await leaderboard.findByIdAndUpdate(find_win._id, {
            //   $set: {
            //     is_win_game: true,
            //   },
            // });

            await leaderboard.updateMany(
              { game_id: game_id, win_count: find_win.win_count },
              {
                $set: {
                  is_win_game: true,
                },
              }
            );
          }

          // for rejoin manage

          if (findMatch.rounds <= get_data.round) {
            await round_details.findByIdAndUpdate(findMatch.current_round_id, {
              $set: { round_status: "game_winner_selected" },
            });
          } else {
            await round_details.findByIdAndUpdate(findMatch.current_round_id, {
              $set: { round_status: "round_winner_selected" },
            });
          }

          let leaderboard_data = await leaderboard
            .find({
              game_id: game_id,
              is_deleted: false,
            })
            .populate({
              path: "user_id",
              select:
                "name profile_picture profile_url is_block membership_type",
            })
            .sort({ win_count: -1 });

          leaderboard_data.map(async (value) => {
            if (value.user_id?.profile_picture) {
              value.user_id.profile_picture =
                process.env.BASE_URL + value.user_id?.profile_picture;
            }
          });

          var send_result = {
            winner_data: get_data,
            leaderboard_data: leaderboard_data,
          };

          // Commit the transaction
          await session.commitTransaction();

          // End the session
          session.endSession();

          // Return success response
          var res_data = await socketSuccessRes(
            "Winner declared successfully",
            send_result
          );
          return res_data;
        }
        // }
        // }
      } else {
        // Game not found
        var res_data = await socketErrorRes("Game not found");
        return res_data;
      }
    } catch (error) {
      // Handle or log the error
      console.error("Error in selectWinGIF:", error);

      // If an error occurs during the transaction, abort it
      await session.abortTransaction();

      // End the session
      session.endSession();

      // Return an error response
      var res_data = await socketErrorRes("Something went wrong!");
      return res_data;
    }
  },

  rematchCreate: async (data) => {
    let { user_id, game_id } = data;
    console.log("rematchCreate   data===========", data);

    // let game_code = Math.floor(100000 + Math.random() * 900000);

    let rematch_update = await games.findByIdAndUpdate(
      game_id,
      {
        $inc: {
          rematch_users_count: 1,
        },
        $addToSet: {
          rematch_users_id: user_id,
        },
      },
      { new: true }
    );

    console.log(
      "rematch_update.players_ids.length --->>> ",
      rematch_update.players_ids.length * (rematch_update.rematch_count + 1)
    );
    console.log(
      "rematch_update.players_ids.length 222222 --->>> ",
      rematch_update.rematch_users_count
    );

    if (
      rematch_update.players_ids.length * (rematch_update.rematch_count + 1) ==
      rematch_update.rematch_users_count
    ) {
      if (rematch_update.rematch_game_id) {
        game_id = rematch_update.rematch_game_id;
      }
      var parent_game_details = await games.findByIdAndUpdate(
        game_id,
        {
          $set: {
            is_rematch_happend: true,
          },
          $inc: {
            rematch_count: 1,
          },
        },
        { new: true }
      );

      let rematch_count = parent_game_details.rematch_count + 1;
      var createData = {
        user_id: parent_game_details.user_id,
        game_name: parent_game_details.game_name + " " + rematch_count,
        players: rematch_update.players,
        game_type: rematch_update.game_type,
        players_ids: rematch_update.players_ids,
        invited_members: rematch_update.invited_members,
        rounds: rematch_update.rounds,
        rule_type: rematch_update.rule_type,
        // players_ids: rematch_update.players_ids,
        rematch_game_id: parent_game_details._id,
        is_rematch: true,
      };

      let selectGame = await games.findOne().sort({ createdAt: -1 });

      if (selectGame) {
        createData = {
          ...createData,
          game_sequence_id: selectGame.game_sequence_id + 1,
        };
      }

      let createGame = await games.create(createData);

      console.log("createGame+++++++++++++", createGame);

      // set start game concept here

      var new_game_id = createGame._id;

      if (
        createGame.players_ids.length >= 5 &&
        createGame.game_type == "public"
      ) {
        var update_data = {
          game_status: "in_progress",
          current_round: createGame.current_round + 1,
        };

        var players_count = createGame.players_ids.length - 1;
        const randomNumber = Math.floor(Math.random() * players_count) + 1;
        console.log("randomNumber-->> ", randomNumber - 1);

        var selected_judge = createGame.players_ids[randomNumber - 1];

        console.log({ selected_judge });

        update_data = {
          ...update_data,
          current_round_judge_id: selected_judge,
        };

        var push_data = { all_judge_ids: selected_judge };
        var updateMatchPlayers = await games
          .findByIdAndUpdate(
            new_game_id,
            {
              $set: update_data,
              $push: push_data,
            },
            { new: true }
          )
          .populate({
            path: "players_ids",
            select: "name profile_picture profile_url is_block membership_type",
          });

        updateMatchPlayers.players_ids.map(async (value) => {
          // create - new

          // await leaderboard.create({
          //   user_id: value._id,
          //   game_id: game_id,
          // });

          let filter = {
            user_id: value._id,
            game_id: new_game_id,
          };

          let updateDoc = {
            user_id: value._id,
            game_id: new_game_id,
          };

          await leaderboard.updateOne(
            filter,
            { $set: updateDoc },
            { upsert: true }
          );
        });

        return updateMatchPlayers;
      } else {
        return createGame;
      }
    } else {
      return null;
    }
  },

  switchRound: async (data) => {
    const { game_id } = data;

    // Check if there's already a lock for this game
    if (gameLocks[game_id]) {
      console.log(`Game ${game_id} is already being processed`);
      return null;
    }

    // Set the lock
    gameLocks[game_id] = true;

    try {
      const findMatch = await games
        .findById(game_id)
        .where({ is_deleted: false })
        .exec();
      console.log("switchRound findMatch ", findMatch);

      if (!findMatch) {
        const res_data = await socketErrorRes("Game not found");
        return res_data;
      }

      if (findMatch.game_status === "completed") {
        const res_data = await socketErrorRes("The game is already completed");
        return res_data;
      }

      if (findMatch.is_current_round_switch) {
        return null;
      }

      findMatch.is_current_round_switch = true;
      await findMatch.save();

      let update_data = {};

      const get_round_submission = await round_submission.find({
        game_id: game_id,
        round: findMatch.current_round,
        is_deleted: false,
      });

      if (get_round_submission.length > 0) {
        await round_details.findByIdAndUpdate(findMatch.current_round_id, {
          $set: { round_status: "completed" },
        });

        update_data = {
          ...update_data,
          current_round: findMatch.current_round + 1,
        };
      }

      let unselected_id;
      if (
        findMatch.sudden_death_players_ids?.length > 0 &&
        findMatch.sudden_death_players_ids?.length <=
          findMatch.players_ids.length
      ) {
        findMatch.sudden_death_players_ids.forEach((value) => {
          const index = findMatch.players_ids.indexOf(value);
          if (index !== -1) {
            findMatch.players_ids.splice(index, 1);
          }
        });
        unselected_id = findMatch.players_ids;
      } else {
        unselected_id = findMatch.players_ids.filter(
          (value) => !findMatch.all_judge_ids.includes(value)
        );
      }

      if (unselected_id.length <= 0) {
        const findMatchData = await games.findById(game_id);
        unselected_id =
          findMatch.sudden_death_players_ids?.length > 0
            ? findMatch.sudden_death_players_ids
            : findMatchData.players_ids;
      }

      const players_count =
        unselected_id.length === 1
          ? unselected_id.length
          : unselected_id.length - 1;
      const randomNumber = Math.floor(Math.random() * players_count) + 1;
      const selected_judge = unselected_id[randomNumber - 1];

      update_data = { ...update_data, current_round_judge_id: selected_judge };

      const push_data = { all_judge_ids: selected_judge };

      const updateMatch = await games
        .findByIdAndUpdate(
          game_id,
          {
            $set: update_data,
            $push: push_data,
          },
          { new: true }
        )
        .populate({
          path: "players_ids",
          select: "name profile_picture profile_url is_block membership_type",
        });

      updateMatch.players_ids.forEach(async (value) => {
        if (value.profile_picture) {
          value.profile_picture = process.env.BASE_URL + value.profile_picture;
        }

        const filter = { user_id: value._id, game_id: game_id };
        const updateDoc = { user_id: value._id, game_id: game_id };

        await leaderboard.updateOne(
          filter,
          { $set: updateDoc },
          { upsert: true }
        );
      });

      const res_data = await socketSuccessRes(
        "Round switched successfully",
        updateMatch
      );
      return res_data;
    } catch (error) {
      console.error("Error in switchRound event:", error);
      const res_data = await socketErrorRes("Something went wrong!");
      return res_data;
    } finally {
      // Release the lock
      delete gameLocks[game_id];
    }
  },

  // working before game locking
  /* switchRound: async (data) => {
    var { game_id } = data;

    try {
      // Start a transaction
      // const session = await mongoose.startSession();
      // session.startTransaction();

      // Find the game and lock the document
      var findMatch = await games
        .findById(game_id)
        .where({ is_deleted: false })
        // .session(session)
        .exec();

      console.log("switchRound findMatch ", findMatch);

      // Check if the game exists
      if (findMatch) {
        // Check if the game is already completed
        if (findMatch.game_status === "completed") {
          var res_data = await socketErrorRes("The game is already completed");
          return res_data;
        } else {
          // Check if the round switch is already in progress
          if (findMatch.is_current_round_switch == true) {
            // If event once called, abort transaction
            // await session.abortTransaction();
            // session.endSession();
            return null; // Return null if the switch is already in progress
          } else {
            findMatch.is_current_round_switch = true;
            // await findMatch.save({ session: session });
            await findMatch.save();

            // // Commit the transaction
            // await session.commitTransaction();
            // session.endSession();

            var update_data = {};

            // First, check if the current round is completed or not
            let get_round_submission = await round_submission.find({
              game_id: game_id,
              round: findMatch.current_round,
              is_deleted: false,
            });

            if (get_round_submission.length > 0) {
              // Complete the current round
              await round_details.findByIdAndUpdate(
                findMatch.current_round_id,
                {
                  $set: { round_status: "completed" },
                }
              );

              // Increment the current round number
              update_data = {
                ...update_data,
                current_round: findMatch.current_round + 1,
              };
            }

            // Sudden death handle
            if (
              findMatch.sudden_death_players_ids?.length > 0 &&
              findMatch.sudden_death_players_ids?.length <=
                findMatch.players_ids.length
            ) {
              findMatch.sudden_death_players_ids.forEach((value) => {
                let index = findMatch.players_ids.indexOf(value);
                if (index !== -1) {
                  findMatch.players_ids.splice(index, 1);
                }
              });

              var unselected_id = findMatch.players_ids;

              console.log("unselected_id   111  -- ", unselected_id);
            } else {
              var unselected_id = findMatch.players_ids.filter(
                (value) => !findMatch.all_judge_ids.includes(value)
              );

              console.log("unselected_id   222  -- ", unselected_id);
            }

            if (unselected_id.length <= 0) {
              var findMatchData = await games.findById(game_id);

              if (findMatch.sudden_death_players_ids?.legth > 0) {
                var unselected_id_get = findMatch.sudden_death_players_ids;
              } else {
                var unselected_id_get = findMatchData.players_ids;
              }

              unselected_id = unselected_id_get;
              var all_judge_ids_update = [];

              console.log("unselected_id   333  -- ", unselected_id);
            }

            // Select judge from here

            console.log("unselected_id   lenth  -- ", unselected_id.length);

            if (unselected_id.length == 1) {
              var players_count = unselected_id.length;
            } else {
              var players_count = unselected_id.length - 1;
            }

            console.log("players_count----", players_count);
            const randomNumber = Math.floor(Math.random() * players_count) + 1;
            console.log("randomNumber-->> ", randomNumber - 1);

            var selected_judge = unselected_id[randomNumber - 1];

            console.log({ selected_judge });

            update_data = {
              ...update_data,
              current_round_judge_id: selected_judge,
            };

            if (all_judge_ids_update) {
              update_data = {
                ...update_data,
                current_round_judge_id: selected_judge,
              };
            }

            var push_data = { all_judge_ids: selected_judge };

            var updateMatch = await games
              .findByIdAndUpdate(
                game_id,
                {
                  $set: update_data,
                  $push: push_data,
                },
                { new: true }
              )
              .populate({
                path: "players_ids",
                select:
                  "name profile_picture profile_url is_block membership_type",
              });

            updateMatch.players_ids.forEach(async (value) => {
              if (value.profile_picture) {
                value.profile_picture =
                  process.env.BASE_URL + value.profile_picture;
              }

              let filter = {
                user_id: value._id,
                game_id: game_id,
              };

              let updateDoc = {
                user_id: value._id,
                game_id: game_id,
              };

              await leaderboard.updateOne(
                filter,
                { $set: updateDoc },
                { upsert: true }
              );
            });

            // Return success response
            var res_data = await socketSuccessRes(
              "Round switched successfully",
              updateMatch
            );
            return res_data;
          }
        }
      } else {
        // Game not found
        var res_data = await socketErrorRes("Game not found");
        return res_data;
      }
    } catch (error) {
      // Handle or log the error
      console.error("Error in switchRound event:", error);

      let res_data = await socketErrorRes("Something went wrong!");
      return res_data;
    }
  }, */

  /* switchRound: async (data) => {
    var { game_id } = data;

    // Start a Mongoose session
    const session = await mongoose.startSession();

    console.log("switchRound session ", session);

    try {
      // Start the transaction
      await session.startTransaction();

      // Find the game
      var findMatch = await games
        .findById(game_id)
        .where({ is_deleted: false })
        .session(session);

      console.log("switchRound findMatch ", findMatch);

      // Check if the game exists
      if (!findMatch) {
        // Game not found
        throw new Error("Game not found");
      }

      // Check if the game is already completed
      if (findMatch.game_status === "completed") {
        throw new Error("The game is already completed");
      }

      // Check if the round switch is already in progress
      if (findMatch.is_current_round_switch === true) {
        return null; // Return null if the switch is already in progress
      }

      var update_data = {};

      // First, check if the current round is completed or not
      let get_round_submission = await round_submission
        .find({
          game_id: game_id,
          round: findMatch.current_round,
          is_deleted: false,
        })
        .session(session);

      if (get_round_submission.length > 0) {
        // Complete the current round
        await round_details
          .findByIdAndUpdate(findMatch.current_round_id, {
            $set: { round_status: "completed" },
          })
          .session(session);

        // Increment the current round number
        update_data = {
          ...update_data,
          current_round: findMatch.current_round + 1,
        };
      }

      // Sudden death handle
      if (
        findMatch.sudden_death_players_ids?.length > 0 &&
        findMatch.sudden_death_players_ids?.length <=
          findMatch.players_ids.length
      ) {
        findMatch.sudden_death_players_ids.forEach((value) => {
          let index = findMatch.players_ids.indexOf(value);
          if (index !== -1) {
            findMatch.players_ids.splice(index, 1);
          }
        });

        var unselected_id = findMatch.players_ids;
      } else {
        var unselected_id = findMatch.players_ids.filter(
          (value) => !findMatch.all_judge_ids.includes(value)
        );
      }

      if (unselected_id.length <= 0) {
        unselected_id = findMatch.players_ids;

        var all_judge_ids_update = [];
      }

      // Select judge from here
      var players_count = unselected_id.length - 1;
      const randomNumber = Math.floor(Math.random() * players_count) + 1;
      console.log("randomNumber-->> ", randomNumber - 1);

      var selected_judge = unselected_id[randomNumber - 1];

      console.log({ selected_judge });

      update_data = {
        ...update_data,
        current_round_judge_id: selected_judge,
        is_current_round_switch: true,
      };

      if (all_judge_ids_update) {
        update_data = {
          ...update_data,
          current_round_judge_id: selected_judge,
        };
      }

      var push_data = { all_judge_ids: selected_judge };

      var updateMatch = await games
        .findByIdAndUpdate(
          game_id,
          {
            $set: update_data,
            $push: push_data,
          },
          { new: true }
        )
        .populate({
          path: "players_ids",
          select: "name profile_picture profile_url is_block",
        })
        .session(session);

      updateMatch.players_ids.forEach(async (value) => {
        if (value.profile_picture) {
          value.profile_picture = process.env.BASE_URL + value.profile_picture;
        }

        let filter = {
          user_id: value._id,
          game_id: game_id,
        };

        let updateDoc = {
          user_id: value._id,
          game_id: game_id,
        };

        await leaderboard.updateOne(
          filter,
          { $set: updateDoc },
          { upsert: true }
        );
      });

      // Commit the transaction
      await session.commitTransaction();

      // End the session
      session.endSession();

      // Return success response
      var res_data = await socketSuccessRes(
        "Round switched successfully",
        updateMatch
      );
      return res_data;
    } catch (error) {
      // Handle or log the error
      console.error("Error in switchRound event:", error);

      // If the error is due to a write conflict, retry the operation
      if (error.code === 112) {
        console.log("Retrying operation...");
        // return await switchRound(data);
        return await switchRoundRecall(data);
        // If an error occurs during the transaction, abort it
      } else {
        // If an error occurs during the transaction, abort it
        await session.abortTransaction();

        // End the session
        session.endSession();

        // Return an error response
        let res_data = await socketErrorRes("Something went wrong!");
        return res_data;
      }
    }
  }, */

  // before transaction
  /* switchRound: async (data) => {
    var { game_id } = data;

    var findMatch = await games.findById(game_id).where({ is_deleted: false });

    if (findMatch) {
      if (findMatch.game_status == "completed") {
        var res_data = await socketErrorRes("The game is already completed");
        return res_data;
      } else {
        //complete above round
        
        await round_details.findByIdAndUpdate(findMatch.current_round_id, {
          $set: { round_status: "completed" },
        });

        var update_data = {
          current_round: findMatch.current_round + 1,
        };

        // --

        if (
          findMatch.sudden_death_players_ids?.length > 0 &&
          findMatch.sudden_death_players_ids?.length <=
            findMatch.players_ids.length
        ) {
          findMatch.sudden_death_players_ids.forEach((value) => {
            let index = findMatch.players_ids.indexOf(value);
            if (index !== -1) {
              findMatch.players_ids.splice(index, 1);
            }
          });

          var unselected_id = findMatch.players_ids;
        } else {
          var unselected_id = findMatch.players_ids.filter(
            (value) => !findMatch.all_judge_ids.includes(value)
          );
        }

        if (unselected_id.length <= 0) {
          unselected_id = findMatch.players_ids;

          var all_judge_ids_update = [];
        }

        // select judge from here
        var players_count = unselected_id.length - 1;
        const randomNumber = Math.floor(Math.random() * players_count) + 1;
        console.log("randomNumber-->> ", randomNumber - 1);

        var selected_judge = unselected_id[randomNumber - 1];

        console.log({ selected_judge });

        update_data = {
          ...update_data,
          current_round_judge_id: selected_judge,
        };

        if (all_judge_ids_update) {
          update_data = {
            ...update_data,
            current_round_judge_id: selected_judge,
          };
        }

        var push_data = { all_judge_ids: selected_judge };

        var updateMatch = await games
          .findByIdAndUpdate(
            game_id,
            {
              $set: update_data,
              $push: push_data,
            },
            { new: true }
          )
          .populate({
            path: "players_ids",
            select: "name profile_picture profile_url is_block",
          });

        updateMatch.players_ids.map(async (value) => {
          if (value.profile_picture) {
            value.profile_picture =
              process.env.BASE_URL + value.profile_picture;
          }

          // create - new

          // await leaderboard.create({
          //   user_id: value._id,
          //   game_id: game_id,
          // });

          let filter = {
            user_id: value._id,
            game_id: game_id,
          };

          let updateDoc = {
            user_id: value._id,
            game_id: game_id,
          };

          await leaderboard.updateOne(
            filter,
            { $set: updateDoc },
            { upsert: true }
          );
        });

        var res_data = await socketSuccessRes(
          "Round switched sucessfully",
          updateMatch
        );
        return res_data;
      }
    } else {
      var res_data = await socketErrorRes("Game not found");
      return res_data;
    }
  }, */

  exitGame: async (data) => {
    console.log("++++++++++++++++++++++++++++++++", data);
    var { game_id, user_id } = data;

    console.log("exit game working", data);
    console.log("game id and user_id ", game_id, user_id);

    const find_user = await users.findOne({ _id: user_id, is_deleted: false });
    if (find_user) {
      await users.findByIdAndUpdate(
        { _id: user_id },
        {
          $set: {
            socket_id: null,
          },
        },
        { new: true }
      );
      // return updatesocketid;
    }
    var findMatch = await games.findById(game_id).where({ is_deleted: false });

    if (findMatch) {
      var findPlayerInMatch = await games
        .findById(game_id)
        .where({ is_deleted: false, players_ids: user_id })
        .populate({
          path: "players_ids",
          select: "name profile_picture profile_url is_block membership_type",
        });

      if (findPlayerInMatch) {
        var updateMatch = await games
          .findByIdAndUpdate(
            game_id,
            {
              $pull: { players_ids: user_id },
              $push: { exit_players_ids: user_id },
            },
            { new: true }
          )
          .populate({
            path: "players_ids",
            select: "name profile_picture profile_url is_block membership_type",
          })
          .populate({
            path: "exit_players_ids",
            select: "name profile_picture profile_url is_block membership_type",
          });

        if (
          updateMatch.players_ids.length < 3
          // &&findMatch.game_status == "in_progress"   // comment this because cliennt give bug in lobby screen game not close
        ) {
          updateMatch = await games.findByIdAndUpdate(
            game_id,
            {
              $set: { game_status: "completed" },
            },
            { new: true }
          );

          // ==== unlink gif here

          // find all images of that game

          let get_gif_data = await round_submission.find({
            game_id: game_id,
          });

          // unlink all images
          get_gif_data.map(async (value) => {
            const fileName = `${outputPath}public/${value.gif_name}`;

            if (
              fileName !== `${outputPath}public/gif_storage/Loser_Bright.gif` &&
              fileName !== `${outputPath}public/gif_storage/Loser_Dark.gif` &&
              value.is_url !== true
            ) {
              // Check if it's the file you want to keep
              await fs.unlink(fileName, (err) => {
                if (err) console.error(err); // Log errors for debugging
              });
            } else {
              console.log(`Skipping deletion of ${fileName}`); // Optional: Log the skipped file
            }
          });
          //==========
        }

        updateMatch = { ...updateMatch._doc, leave_user_id: user_id };

        updateMatch.players_ids?.map(async (value) => {
          if (value.profile_picture) {
            value.profile_picture =
              process.env.BASE_URL + value.profile_picture;
          }
        });

        updateMatch.exit_players_ids?.map(async (value) => {
          if (value.profile_picture) {
            value.profile_picture =
              process.env.BASE_URL + value.profile_picture;
          }
        });

        // update switch round false if judge leave

        if (
          user_id.toString() == findMatch.current_round_judge_id?.toString()
        ) {
          findMatch.is_current_round_switch = false;
          await findMatch.save();
        }

        var res_data = await socketSuccessRes(
          "Game leave successfully",
          updateMatch
        );

        return res_data;
      } else {
        var res_data = await socketErrorRes(
          "You are not a player of this game"
        );
        return res_data;
      }
    } else {
      var res_data = await socketErrorRes("Game not found");
      return res_data;
    }
  },

  selectWinPlayer: async (data) => {
    var { game_id } = data;

    // Start a Mongoose session
    const session = await mongoose.startSession();

    try {
      // Start the transaction
      await session.startTransaction();

      // Find the game and populate player details
      var findMatch = await games
        .findById(game_id)
        .where({ is_deleted: false })
        .populate({
          path: "players_ids",
          select: "name profile_picture profile_url is_block membership_type",
        })
        .session(session);

      if (!findMatch) {
        // Game not found
        throw new Error("Game not found");
      }

      if (findMatch.is_winner_declared == true) {
        // If winner is declared, return null
        return null;
      } else {
        // Update is_winner_declared field
        await games
          .findByIdAndUpdate(game_id, {
            $set: { is_winner_declared: true },
          })
          .session(session);

        // Find the winner in the leaderboard
        let find_win = await leaderboard
          .findOne()
          .where({ game_id: game_id, is_win_game: true, is_deleted: false })
          .populate({
            path: "user_id",
            select: "name profile_picture profile_url is_block membership_type",
          })
          .session(session);

        if (find_win) {
          // Check for draw users
          let find_win_draw = await leaderboard
            .find()
            .where({ game_id: game_id, win_count: find_win.win_count })
            .populate({
              path: "user_id",
              select:
                "name profile_picture profile_url is_block membership_type",
            })
            .session(session);

          if (find_win_draw.length > 1) {
            // Additional logic for handling draw users if needed

            find_win_draw.forEach((value) => {
              if (value.user_id?.profile_picture) {
                value.user_id.profile_picture =
                  process.env.BASE_URL + value.user_id?.profile_picture;
              }
            });

            var result_array = find_win_draw;
          } else {
            if (find_win.user_id?.profile_picture) {
              find_win.user_id.profile_picture =
                process.env.BASE_URL + find_win.user_id?.profile_picture;
            }

            var result_array = [find_win];
          }

          // Commit the transaction
          await session.commitTransaction();

          // End the session
          session.endSession();

          // Return success response
          var res_data = await socketSuccessRes(
            "Winner declared successfully",
            result_array
          );
          return res_data;
        } else {
          // No winner found

          var res_data = await socketErrorRes("No winner found");
          return res_data;
        }
      }
    } catch (error) {
      // Handle or log the error
      console.error("Error in selectWinPlayer:", error);

      // If an error occurs during the transaction, abort it
      await session.abortTransaction();

      // End the session
      session.endSession();

      // Return an error response
      // var res_data = await socketErrorRes("Something went wrong!");
      // return res_data;
      return null;
    }
  },

  // before transaction
  /* selectWinPlayer: async (data) => {
    var { game_id } = data;

    var findMatch = await games
      .findById(game_id)
      .where({ is_deleted: false })
      .populate({
        path: "players_ids",
        select: "name profile_picture profile_url is_block",
      });

    if (findMatch) {
      if (findMatch.is_winner_declared == false) {
        return null;
      } else {
        await games.findByIdAndUpdate(game_id, {
          $set: { is_winner_declared: true },
        });

        let find_win = await leaderboard
          .findOne()
          .where({ game_id: game_id, is_win_game: true, is_deleted: false })
          .populate({
            path: "user_id",
            select: "name profile_picture profile_url is_block",
          });

        if (find_win) {
          // check draw user
          let find_win_draw = await leaderboard
            .find()
            .where({ game_id: game_id, win_count: find_win.win_count })
            .populate({
              path: "user_id",
              select: "name profile_picture profile_url is_block",
            });

          if (find_win_draw.length > 1) {
            // here - manage futher process or event if needed to send server

            find_win_draw.map(async (value) => {
              if (value.user_id?.profile_picture) {
                value.user_id.profile_picture =
                  process.env.BASE_URL + value.user_id?.profile_picture;
              }
            });

            var result_array = find_win_draw;
          } else {
            if (find_win.user_id?.profile_picture) {
              find_win.user_id.profile_picture =
                process.env.BASE_URL + find_win.user_id?.profile_picture;
            }

            var result_array = [];
            result_array.push(find_win);
          }

          var res_data = await socketSuccessRes(
            "Winner declared successfully",
            result_array
          );

          return res_data;
        } else {
          var res_data = await socketErrorRes("No winner found");
          return res_data;
        }
      }
    } else {
      var res_data = await socketErrorRes("Game not found");
      return res_data;
    }
  }, */

  getGameAllMessage: async (data) => {
    let { game_id, user_id, skip = 0, limit = 10 } = data;

    var findAllMessage = await game_chat
      .find({
        game_id: game_id,
      })
      .where({
        is_delete_by: { $ne: user_id },
      })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .populate({
        path: "user_id",
        select:
          "name full_name profile_url profile_picture is_block membership_type",
      });

    findAllMessage.forEach((value) => {
      if (
        value?.user_id?.profile_picture &&
        !value?.user_id?.profile_picture.startsWith(process.env.BASE_URL)
      ) {
        value.user_id.profile_picture =
          process.env.BASE_URL + value.user_id.profile_picture;
      }
    });

    return findAllMessage;
  },

  getUserDetails: async (data) => {
    let { game_id } = data;
    // let game_code = Math.floor(100000 + Math.random() * 900000);

    // let user_data = await users.findById(user_id);

    // user_data.profile_picture =
    //   process.env.BASE_URL + user_data.profile_picture;

    let game_data = await games.findById(game_id).populate({
      path: "rematch_users_id",
      select: "name profile_picture profile_url is_block membership_type",
    });

    game_data?.rematch_users_id?.forEach((value) => {
      if (
        value?.profile_picture &&
        !value?.profile_picture.startsWith(process.env.BASE_URL)
      ) {
        value.profile_picture = process.env.BASE_URL + value.profile_picture;
      }
    });
    return game_data;
  },

  chatSuggestionList: async (data) => {
    const quick_chat_list = await quickChat
      .find({ is_deleted: false })
      .sort({ order: 1 });
    if (quick_chat_list) {
      return quick_chat_list;
    }
  },

  /// ============================================================   PUBLIC GAME CHANGES

  joinPublicMatch: async (data) => {
    var { user_id } = data;

    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the games which have available spots
      const availableGames = await games
        .find({
          is_deleted: false,
          game_type: "public",
          is_rematch: false,
          is_sudden_death: false,
          game_status: "waiting",
        })
        .session(session)
        .exec();

      // Filter the available games based on the condition that players_ids length is less than players
      const filteredGames = availableGames.filter(
        (game) => game.players_ids.length < game.players
      );

      // If there are filtered games, join the first one
      if (filteredGames.length > 0) {
        const findPlayerInMatch = await games
          .findById(filteredGames[0]._id)
          .where({ is_deleted: false, players_ids: user_id })
          .populate({
            path: "players_ids",
            select: "name profile_picture profile_url is_block membership_type",
          });

        // If the player is already in the match, return appropriate response
        if (findPlayerInMatch) {
          // Modify the player profile picture URL
          findPlayerInMatch.players_ids.map(async (value) => {
            if (value.profile_picture) {
              value.profile_picture = value.profile_picture
                ? process.env.BASE_URL + value.profile_picture
                : value.profile_url;
            }
          });

          return socketSuccessRes(
            "You already joined this game",
            findPlayerInMatch
          );
        } else {
          // Check if the player is already in the game
          const checkPlayers = await games
            .findById(filteredGames[0]._id)
            .where({ players_ids: user_id });

          var game_id = filteredGames[0]._id;

          // Update the game by adding the player to the players_ids array
          const updateMatch = await games
            .findByIdAndUpdate(
              game_id,
              {
                $push: { players_ids: user_id },
              },
              { new: true }
            )
            .populate({
              path: "players_ids",
              select:
                "name profile_picture profile_url is_block membership_type",
            });

          // Modify the player profile picture URL
          updateMatch.players_ids.map(async (value) => {
            if (value.profile_picture) {
              value.profile_picture = value.profile_picture
                ? process.env.BASE_URL + value.profile_picture
                : value.profile_url;
            }
          });

          // set start game concept here

          if (updateMatch.players_ids.length >= 5) {
            var update_data = {
              game_status: "in_progress",
              current_round: updateMatch.current_round + 1,
            };

            var players_count = updateMatch.players_ids.length - 1;
            const randomNumber = Math.floor(Math.random() * players_count) + 1;
            console.log("randomNumber-->> ", randomNumber - 1);

            var selected_judge = updateMatch.players_ids[randomNumber - 1];

            console.log({ selected_judge });

            update_data = {
              ...update_data,
              current_round_judge_id: selected_judge,
            };

            var push_data = { all_judge_ids: selected_judge };
            var updateMatchPlayers = await games
              .findByIdAndUpdate(
                game_id,
                {
                  $set: update_data,
                  $push: push_data,
                },
                { new: true }
              )
              .populate({
                path: "players_ids",
                select:
                  "name profile_picture profile_url is_block membership_type",
              });

            updateMatchPlayers.players_ids.map(async (value) => {
              // create - new

              // await leaderboard.create({
              //   user_id: value._id,
              //   game_id: game_id,
              // });

              let filter = {
                user_id: value._id,
                game_id: game_id,
              };

              let updateDoc = {
                user_id: value._id,
                game_id: game_id,
              };

              await leaderboard.updateOne(
                filter,
                { $set: updateDoc },
                { upsert: true }
              );
            });

            return socketSuccessRes(
              "You are successfully joined in this game",
              updateMatchPlayers
            );
          } else {
            return socketSuccessRes(
              "You are successfully joined in this game",
              updateMatch
            );
          }
        }
      } else {
        console.log("creating a new game -->> ");
        // Create a new game if no available games found
        let selectGame = await games.findOne().sort({ createdAt: -1 });

        var game_name = "Public Game 1";

        var createData = {
          user_id: user_id,
          players: 5,
          rounds: 5,
          rule_type: "party_rules",
          players_ids: user_id,
        };

        if (selectGame) {
          createData = {
            ...createData,
            game_sequence_id: selectGame.game_sequence_id + 1,
          };

          game_name =
            "Public Game " + parseInt(selectGame.game_sequence_id + 1);
        }

        createData = {
          ...createData,
          game_name: game_name,
        };

        var createGame = await games.create(createData);

        var find_game = await games.findById(createGame._id).populate({
          path: "players_ids",
          select: "name profile_picture profile_url is_block membership_type",
        });

        console.log("find_game--", find_game);

        // Modify the player profile picture URL
        find_game.players_ids?.map(async (value) => {
          if (value.profile_picture) {
            value.profile_picture =
              process.env.BASE_URL + value.profile_picture;
          }
        });

        return socketSuccessRes(
          "You are successfully joined in this game",
          find_game
        );
      }
    } catch (error) {
      console.error("Error:", error);
      // Rollback the transaction in case of error
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
      session.endSession();
    }
  },

  // ==========================================

  disconnect: async (data) => {
    var { socket_data } = data;

    console.log("socket_data", socket_data);

    const find_user = await users.findOne({
      socket_id: socket_data,
      is_deleted: false,
    });

    if (find_user) {
      var user_id = find_user?._id;
      console.log("user_id", user_id);
      if (user_id) {
        var find_game = await games
          .find({
            game_status: "in_progress",
            players_ids: user_id,
          })
          .sort({ createdAt: -1 });

        console.log("find_game", find_game[0]);

        if (find_game.length > 0) {
          return {
            user_id: user_id.toString(),
            game_id: find_game[0]?._id.toString(),
            rematch_game_id: find_game[0]?.rematch_game_id,
          };
        } else {
          return null;
        }

        // if (find_game) {
        //   await games.updateOne(
        //     { _id: find_game._id },
        //     { $pull: { "players_ids": user_id } }
        //   );
        // }
      }
    }
  },
};
