const {
  createMatch,
  matchList,
  matchDetails,
  joinMatch,
  startMatch,
  generateClue,
  sendMessage,
  submitGIF,
  revealResult,
  selectWinGIF,
  rematchCreate,
  switchRound,
  exitGame,
  selectWinPlayer,
  getGameAllMessage,
  getUserDetails,
  chatSuggestionList,
  privatematchList,
  joinPublicMatch,
  disconnect,
} = require("./games_event");

const users = require("../../api/models/M_user");
const games = require("../../api/models/M_games");
const mongoose = require("mongoose");
const { socketSuccessRes, socketErrorRes } = require("../../utils/common_fun");

module.exports = function (io) {
  var v1version = io.of("/v1");
  v1version.on("connection", (socket) => {
    console.log("Socket connected  v1.....", socket.id);

    socket.on("disconnect", async (data) => {
      try {
        var socket_data = socket.id;

        data = {
          ...data,
          socket_data: socket_data,
        };
        var disconnect_game = await disconnect(data);

        if (disconnect_game != null) {
          let exit_game = await exitGame(disconnect_game);

          if (disconnect_game.rematch_game_id) {
            socket.join(disconnect_game.rematch_game_id);

            v1version
              .to(disconnect_game.rematch_game_id.toString())
              .emit("exitGame", exit_game);

            socket.leave(disconnect_game.rematch_game_id.toString());
          } else {
            socket.join(disconnect_game.game_id);

            v1version
              .to(disconnect_game.game_id.toString())
              .emit("exitGame", exit_game);

            socket.leave(disconnect_game.game_id.toString());
          }
        }
      } catch (error) {
        console.log("ERROR === exitGame ===", error);
        let res_data = await socketErrorRes("Something went wrong!");
        socket.emit("exitGame", res_data);
      }
    });

    /*  PAYLOAD --> 
      {
        "user_id":"63c8c46dedf1682155c610f2",
        "game_name":"harita's game",
        "players":3,
        "rounds":3,
        "rule_type":"judge",
        "game_type":"private",
        "invited_members":["658c43ce1ec45f7b0f51a30a", "658cf746de8e3b338c59377f"]
      }
    */
    socket.on("createMatch", async (data) => {
      try {
        console.log(" -----------  v1 calling  -----------  ");
        console.log(" createMatch  on ::  ", data);
        // var data = JSON.parse(data);
        var create_game = await createMatch(data);

        // socket.join(create_game);

        let res_data = await socketSuccessRes(
          "Match created sucessfully",
          create_game
        );

        v1version.emit("createMatch", res_data);

        // socket.emit("findRoomOn", resData);
      } catch (error) {
        console.log("=== createMatch ===", error);
        let res_data = await socketErrorRes("Something went wrong!");

        socket.emit("createMatch", res_data);
      }
    });

    /*  PAYLOAD --> 
      {
        "user_id":"658c43ce1ec45f7b0f51a30a",
        "game_type":"private" // private, public
      }
    */
    socket.on("matchList", async (data) => {
      try {
        console.log("matchList on============= ", data);
        // // var data = JSON.parse(data);
        let match_list = await matchList(data);

        let res_data = await socketSuccessRes(
          "Match list get sucessfully",
          match_list
        );

        socket.emit("matchList", res_data);
      } catch (error) {
        console.log("=== matchList ===", error);

        let res_data = await socketErrorRes("Something went wrong!");

        socket.emit("matchList", res_data);
      }
    });

    /*  PAYLOAD --> 
      {
        "game_id":"65926ba120e4033be4bb234b"
      }
    */
    socket.on("matchDetails", async (data) => {
      try {
        console.log("matchDetails on============= ", data);
        // // var data = JSON.parse(data);
        let match_list = await matchDetails(data);

        if (match_list == null) {
          var res_data = await socketErrorRes("Game details not found", []);
        } else {
          var res_data = await socketSuccessRes(
            "Game details get sucessfully",
            match_list
          );
        }

        socket.emit("matchDetails", res_data);
      } catch (error) {
        console.log("=== matchDetails ===", error);

        let res_data = await socketErrorRes("Something went wrong!");

        socket.emit("matchDetails", res_data);
      }
    });

    /*  PAYLOAD -->
      {
        "game_id":"65965801b4e29561948ad260",
        "user_id":"658c41604a4bb46b04121943",
        "rematch_game_id":"65eafa3976ac53b63b07e3a8"
      }
    */
    socket.on("joinMatch", async (data) => {
      try {
        console.log("joinMatch on============= ", data);
        // // var data = JSON.parse(data);
        var socket_data = socket.id;
        data = {
          ...data,
          socket_data,
        };
        let join_match = await joinMatch(data);

        console.log("joinMatch emit  ============= ", join_match);

        if (data.rematch_game_id) {
          socket.join(data.rematch_game_id);

          v1version.to(data.rematch_game_id).emit("joinMatch", join_match);
        } else {
          socket.join(data.game_id);

          v1version.to(data.game_id).emit("joinMatch", join_match);
        }

        let match_list = await matchList(data);

        let res_data = await socketSuccessRes(
          "Match list get successfully",
          match_list
        );
        v1version.emit("matchList", res_data);
      } catch (error) {
        console.log("=== joinMatch ===", error);

        let res_data = await socketErrorRes("Something went wrong!");

        socket.emit("joinMatch", res_data);
      }
    });

    /*  PAYLOAD --> 
      {
        "game_id":"65965801b4e29561948ad260",
        "user_id":"658c41604a4bb46b04121943",
        "rematch_game_id":"65eafa3976ac53b63b07e3a8"
      }
    */
    socket.on("startMatch", async (data) => {
      try {
        console.log("startMatch on============= ", data);
        // // var data = JSON.parse(data);

        let start_match = await startMatch(data);

        if (data.rematch_game_id) {
          socket.join(data.rematch_game_id);
          v1version.to(data.rematch_game_id).emit("startMatch", start_match);
        } else {
          socket.join(data.game_id);
          v1version.to(data.game_id).emit("startMatch", start_match);
        }
      } catch (error) {
        console.log("=== startMatch ===", error);

        let res_data = await socketErrorRes("Something went wrong!");

        socket.emit("startMatch", res_data);
      }
    });

    /*  PAYLOAD --> 
      {
        "game_id":"65926ba120e4033be4bb234b",
        "category_id":"658e5e7a3552993e0691375f",
        "rematch_game_id":"65eafa3976ac53b63b07e3a8"
      }
    */
    socket.on("generateClue", async (data) => {
      try {
        console.log("generateClue on============= ", data);
        // // var data = JSON.parse(data);
        let generate_clue = await generateClue(data);

        if (data.rematch_game_id) {
          socket.join(data.rematch_game_id);
          v1version
            .to(data.rematch_game_id)
            .emit("generateClue", generate_clue);
        } else {
          socket.join(data.game_id);
          v1version.to(data.game_id).emit("generateClue", generate_clue);
        }
      } catch (error) {
        console.log("=== generateClue ===", error);

        let res_data = await socketErrorRes("Something went wrong!");

        socket.emit("generateClue", res_data);
      }
    });

    /*  PAYLOAD-- >
      {
        "game_id":"65965801b4e29561948ad260",
        "user_id":"658e695d37612d5551fc9310", 
        "message":"Hello",
        "rematch_game_id":"65eafa3976ac53b63b07e3a8"
      }
    */
    socket.on("sendMessage", async (data) => {
      console.log("sendMessage ==> ", data);
      // var data = JSON.parse(data);

      // comment after get message event
      socket.join(data.game_id);

      let newMessage = await sendMessage(data);

      if (data.rematch_game_id) {
        socket.join(data.rematch_game_id);
        v1version.to(data.rematch_game_id).emit("sendMessage", newMessage);
      } else {
        socket.join(data.game_id);
        v1version.to(data.game_id).emit("sendMessage", newMessage);
      }
    });

    /*  PAYLOAD-- >
      {
        "game_id":"65a11bc1e87ec5f90be55329",
        "user_id":"658e8d9537612d5551fc935e", 
        "gif_name":"gif_storage/6541_1705062479393.gif",
        "category_id":"658e5e7a3552993e0691375f",
        "clue_id":"658e67f8aa5c0d91625cb301",
        "round":1,
        "is_url":true,
        "rematch_game_id":"65eafa3976ac53b63b07e3a8"
      }
    */
    socket.on("submitGIF", async (data) => {
      // console.log("submitGIF ==> ", data);
      // var data = JSON.parse(data);

      // socket.join(data.game_id);

      let submit_gif = await submitGIF(data);

      if (data.rematch_game_id) {
        socket.join(data.rematch_game_id);
        v1version.to(data.rematch_game_id).emit("submitGIF", submit_gif);
      } else {
        // socket.emit("submitGIF", submit_gif);
        v1version.to(data.game_id).emit("submitGIF", submit_gif);
      }

      if (submit_gif?.data?.is_all_submitted == true) {
        if (data.rematch_game_id) {
          socket.join(data.rematch_game_id);
          v1version
            .to(data.rematch_game_id)
            .emit("showRevealButton", submit_gif);
        } else {
          v1version.to(data.game_id).emit("showRevealButton", submit_gif);
        }
      }
    });

    /*  PAYLOAD-- >
      {
        "game_id":"65a11bc1e87ec5f90be55329",
        "user_id":"658e8d9537612d5551fc935e", 
        "round":1,
        "rematch_game_id":"65eafa3976ac53b63b07e3a8"
      }
    */
    socket.on("revealResult", async (data) => {
      console.log("revealResult ==> ", data);
      // var data = JSON.parse(data);

      let reveal_result = await revealResult(data);

      if (reveal_result != null) {
        if (data.rematch_game_id) {
          socket.join(data.rematch_game_id);
          v1version
            .to(data.rematch_game_id)
            .emit("revealResult", reveal_result);

          // set timer here - how long time need to send selectWinGIF ON

          // comment because now set from frontend side

          // var winner_select_timer = 30;

          // winner_select_timer += 5; // Big Reveal Text
          // winner_select_timer += 5; // Judgement Text
          // winner_select_timer += reveal_result.data.length * 5; // All gif showing : 5 sec * all gif

          // winner_select_timer *= 1000; // for chaneg in micro sec

          // console.log({ winner_select_timer });

          // // after 30 seconds send selecet win gif emit

          // setTimeout(async () => {
          //   console.log("selectWinGIF  revealResult emit  -->>  ");
          //   let select_win_gif = await selectWinGIF(data);

          //   if (select_win_gif != null) {
          //     v1version
          //       .to(data.rematch_game_id)
          //       .emit("selectWinGIF", select_win_gif);
          //   }
          // }, winner_select_timer); // Delay of 30000 milliseconds (30 seconds)
        } else {
          socket.join(data.game_id);

          v1version.to(data.game_id).emit("revealResult", reveal_result);

          // set timer here - how long time need to send selectWinGIF ON

          // comment because now set from frontend side

          // var winner_select_timer = 30;

          // winner_select_timer += 5; // Big Reveal Text
          // winner_select_timer += 5; // Judgement Text
          // winner_select_timer += reveal_result.data.length * 5; // All gif showing : 5 sec * all gif

          // winner_select_timer *= 1000; // for chaneg in micro sec

          // console.log({ winner_select_timer });

          // // after 30 seconds send selecet win gif emit
          // setTimeout(async () => {
          //   console.log("selectWinGIF  revealResult emit  -->>  ");
          //   let select_win_gif = await selectWinGIF(data);

          //   if (select_win_gif != null) {
          //     v1version.to(data.game_id).emit("selectWinGIF", select_win_gif);
          //   }
          // }, winner_select_timer); // Delay of 30000 milliseconds (30 seconds)
        }
      }

      // else {
      //   if (data.rematch_game_id) {
      //     socket.join(data.rematch_game_id);

      //     // after 30 seconds send selecet win gif emit

      //     setTimeout(async () => {
      //       console.log("selectWinGIF  revealResult emit  -->>  ");
      //       let select_win_gif = await selectWinGIF(data);

      //       if (select_win_gif != null) {
      //         v1version
      //           .to(data.rematch_game_id)
      //           .emit("selectWinGIF", select_win_gif);
      //       }
      //     }, 30000); // Delay of 30000 milliseconds (30 seconds)
      //   } else {
      //     socket.join(data.game_id);

      //     // after 30 seconds send selecet win gif emit
      //     setTimeout(async () => {
      //       console.log("selectWinGIF  revealResult emit  -->>  ");
      //       let select_win_gif = await selectWinGIF(data);

      //       if (select_win_gif != null) {
      //         v1version.to(data.game_id).emit("selectWinGIF", select_win_gif);
      //       }
      //     }, 30000); // Delay of 30000 milliseconds (30 seconds)
      //   }
      // }

      console.log("revealResult  -- emit  ==> ", reveal_result);
    });

    /*  PAYLOAD-- >
      {
        "game_id":"65a1390373e4a4e92d0de0e9",
        "user_id":"658e8d9537612d5551fc935e", 
        "round_submission_id":"65a13b4173e4a4e92d0de16e",
        "rematch_game_id":"65eafa3976ac53b63b07e3a8"
      }
    */
    socket.on("selectWinGIF", async (data) => {
      console.log("selectWinGIF ==> ", data);
      // var data = JSON.parse(data);

      let select_win_gif = await selectWinGIF(data);

      if (select_win_gif != null) {
        if (data.rematch_game_id) {
          socket.join(data.rematch_game_id);
          v1version
            .to(data.rematch_game_id)
            .emit("selectWinGIF", select_win_gif);

          console.log("selectWinGIF   emit  ==> ", select_win_gif);
        } else {
          socket.join(data.game_id);
          v1version.to(data.game_id).emit("selectWinGIF", select_win_gif);
          console.log("selectWinGIF   emit  ==> ", select_win_gif);
        }
      }
    });

    /*  PAYLOAD-- >
      {
        "game_id":"65a1390373e4a4e92d0de0e9",
        "rematch_game_id":"65eafa3976ac53b63b07e3a8"
      }
    */
    socket.on("selectWinPlayer", async (data) => {
      console.log("selectWinPlayer --  On  ==> ", data);
      // var data = JSON.parse(data);

      let select_win_player = await selectWinPlayer(data);

      if (select_win_player != null) {
        if (data.rematch_game_id) {
          socket.join(data.rematch_game_id);
          v1version
            .to(data.rematch_game_id)
            .emit("selectWinPlayer", select_win_player);
        } else {
          socket.join(data.game_id);
          v1version.to(data.game_id).emit("selectWinPlayer", select_win_player);
        }
      }

      console.log("selectWinPlayer  ---   emit ---", select_win_player);
    });

    /*  PAYLOAD --> 
      {
        "user_id":"63c8c46dedf1682155c610f2",
        "game_id":"65a1390373e4a4e92d0de0e9",
        "rematch_game_id":"65eafa3976ac53b63b07e3a8"
      }
    */
    socket.on("rematchCreate", async (data) => {
      try {
        console.log(" rematchCreate  on ::  ", data);
        // var data = JSON.parse(data);
        var create_game = await rematchCreate(data);
        // socket.join(create_game);

        let res_data = await socketSuccessRes(
          "Rematch created sucessfully",
          create_game
        );

        if (create_game == null) {
          var get_user_details = await getUserDetails(data);

          let response_data = await socketSuccessRes(
            "Rematch created sucessfully",
            get_user_details
          );

          console.log("Rematch get null  ===>>>>>>>>>>>>>>>", res_data);

          if (data.rematch_game_id) {
            socket.join(data.rematch_game_id);
            v1version
              .to(data.rematch_game_id)
              .emit("rematchCreate", response_data);
          } else {
            socket.join(data.game_id);
            v1version.to(data.game_id).emit("rematchCreate", response_data);
          }
        } else {
          console.log("Rematch get  ===>>>>>>>>>>>>>>>", res_data);

          if (data.rematch_game_id) {
            socket.join(data.rematch_game_id);

            v1version.to(data.rematch_game_id).emit("rematchCreate", res_data);

            v1version.to(data.rematch_game_id).emit("createRematch", res_data);

            v1version.to(data.rematch_game_id).emit("createMatch", res_data);

            // start match from here for public match

            if (res_data.data.game_status == "in_progress") {
              setTimeout(() => {
                console.log("rematchCreate  startMatch emit  -->>  ");
                v1version.to(data.rematch_game_id).emit("startMatch", res_data);
              }, 2000); // Delay of 2000 milliseconds (2 seconds)
            }
          } else {
            socket.join(data.game_id);

            v1version.to(data.game_id).emit("rematchCreate", res_data);
            // v1version.emit("createMatch", res_data);
            // socket.emit("createMatch", res_data);

            // Delay the execution of "createRematch" by 2 seconds
            // setTimeout(() => {
            //   v1version.to(data.game_id).emit("createRematch", res_data);
            // }, 2000);

            v1version.to(data.game_id).emit("createRematch", res_data);

            v1version.to(data.game_id).emit("createMatch", res_data);

            if (res_data.data.game_status == "in_progress") {
              setTimeout(() => {
                console.log("rematchCreate  startMatch emit  -->>  ");
                v1version.to(data.game_id).emit("startMatch", res_data);
              }, 2000); // Delay of 2000 milliseconds (2 seconds)
            }
          }
        }

        // socket.emit("findRoomOn", resData);
      } catch (error) {
        console.log("=== rematchCreate ===", error);
        let res_data = await socketErrorRes("Something went wrong!");

        socket.emit("rematchCreate", res_data);
      }
    });

    /*  PAYLOAD --> 
      {
        "game_id":"65a1390373e4a4e92d0de0e9",
        "rematch_game_id":"65eafa3976ac53b63b07e3a8"

      }
    */
    socket.on("switchRound", async (data) => {
      try {
        console.log("switchRound on :: ", data);
        const switch_round = await switchRound(data);

        if (switch_round != null) {
          if (data.rematch_game_id) {
            socket.join(data.rematch_game_id);
            v1version
              .to(data.rematch_game_id)
              .emit("switchRound", switch_round);
          } else {
            socket.join(data.game_id);
            v1version.to(data.game_id).emit("switchRound", switch_round);
          }
        }

        console.log("switchRound -- emit -->>>> ", switch_round);
      } catch (error) {
        console.log("=== switchRound ===", error);
        const res_data = await socketErrorRes("Something went wrong!");
        socket.emit("switchRound", res_data);
      }
    });

    /*  PAYLOAD --> 
      {
        "game_id":"65965801b4e29561948ad260",
        "user_id":"658c41604a4bb46b04121943",
        "rematch_game_id":"65eafa3976ac53b63b07e3a8"
        
      }
    */
    socket.on("exitGame", async (data) => {
      try {
        console.log("exitGame on============= ", data);
        // // var data = JSON.parse(data);
        let join_match = await exitGame(data);

        console.log(
          "exit game from exit game -----------------------+-",
          join_match
        );

        if (data.rematch_game_id) {
          socket.join(data.rematch_game_id);
          console.log("exitGame on============= ", data);
          v1version.to(data.rematch_game_id).emit("exitGame", join_match);

          socket.leave(data.rematch_game_id);
        } else {
          socket.join(data.game_id);

          console.log("exitGame on============= ", data);

          v1version.to(data.game_id).emit("exitGame", join_match);

          socket.leave(data.game_id);
        }
      } catch (error) {
        console.log("=== exitGame ===", error);

        let res_data = await socketErrorRes("Something went wrong!");

        socket.emit("exitGame", res_data);
      }
    });

    socket.on("getGameAllMessage", async (data) => {
      try {
        // console.log("chatUserList ============= ", data);
        // // var data = JSON.parse(data);
        socket.join(data.group_id);

        let chatUserData = await getGameAllMessage(data);

        if (chatUserData == null) {
          socket.emit("getGameAllMessage", "Game not found");
        } else {
          // socket.to(data.group_id).emit("getGroupAllMessage", chatUserData);
          socket.emit("getGameAllMessage", chatUserData);
        }
      } catch (error) {
        console.log("=== getGameAllMessage ===", error);
      }
    });

    socket.on("chatSuggestionList", async (data) => {
      try {
        let chatUserData = await chatSuggestionList();
        let response_data = await socketSuccessRes(
          "Rematch created sucessfully",
          chatUserData
        );
        if (chatUserData) {
          socket.emit("chatSuggestionList", response_data);
        }
      } catch (error) {
        console.log("=== getGameAllMessage ===", error);
      }
    });

    /*  PAYLOAD --> 
      {
        "user_id":"658c43ce1ec45f7b0f51a30a",
      }
    */
    socket.on("privatematchList", async (data) => {
      try {
        console.log("privatematchList on============= ", data);
        // // var data = JSON.parse(data);
        let match_list = await privatematchList(data);

        let res_data = await socketSuccessRes(
          "privatematch list get sucessfully",
          match_list
        );

        socket.emit("privatematchList", res_data);
      } catch (error) {
        console.log("=== privatematchList ===", error);

        let res_data = await socketErrorRes("Something went wrong!");

        socket.emit("privatematchList", res_data);
      }
    });

    /// ============================================================   PUBLIC GAME CHANGES
    /*  PAYLOAD --> 
      {
        "user_id":"658c41604a4bb46b04121943"
      }
    */
    socket.on("joinPublicMatch", async (data) => {
      try {
        console.log("joinPublicMatch on============= ", data);
        // // var data = JSON.parse(data);
        let join_match = await joinPublicMatch(data);

        console.log(
          "joinPublicMatch joinMatch emit  ============= ",
          join_match.data._id
        );
        let game_id = join_match.data._id.toString();

        console.log(
          "joinPublicMatch joinMatch emit game_id  ============= ",
          game_id
        );

        socket.join(game_id);

        v1version.to(game_id).emit("joinMatch", join_match);

        if (join_match.data.game_status == "in_progress") {
          setTimeout(() => {
            v1version.to(game_id).emit("startMatch", join_match);
          }, 2000); // Delay of 2000 milliseconds (2 seconds)
        }
      } catch (error) {
        console.log("=== joinPublicMatch ===", error);

        let res_data = await socketErrorRes("Something went wrong!");

        socket.emit("joinPublicMatch", res_data);
      }
    });
  });
};
