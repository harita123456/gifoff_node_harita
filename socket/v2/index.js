const {
  createRoom,
  chatUserList,
  sendMessage,
  getAllMessage,
  deleteChat,
  deleteOneChat,
  unreadMessageUpdate,
} = require("./chat");


module.exports = function (io) {
  v2version = io.of("/v2");
  v2version.on("connection", (socket) => {
    console.log("Socket connected.....", socket.id);

    /*  PAYLOAD --> 
      {
        "user_id":"63c8c46dedf1682155c610f2",
        "other_user_id":"63c8c46dedf1682155c610f2"
      } 
    */
    socket.on("createRoom", async (data) => {
      try {
        console.log(" -----------  v2 calling  -----------  ");

        var data = JSON.parse(data);
        var create_room = await createRoom(data);

        socket.join(create_room);

        v2version.to(create_room).emit("createRoom", create_room);

        // socket.emit("findRoomOn", resData);
      } catch (error) {
        console.log("=== createRoom ===", error.message);
      }
    });

    /*  PAYLOAD --> 
      {
        "user_id":"63c8c46dedf1682155c610f2"  // user_id = login_user_id
      }
    */
    socket.on("chatUserList", async (data) => {
      try {
        // console.log("chatUserList ============= ", data);
        var data = JSON.parse(data);
        let chatUserData = await chatUserList(data);

        socket.emit("chatUserList", chatUserData);
      } catch (error) {
        console.log("=== chatUserList ===", error.message);
      }
    });

    /*  PAYLOAD-- >
      {
        "chat_room_id": "63b32c21dedac0b126bb30fd",
        "sender_id": "64059b1e6b6e26e64c9df0c3",
        "receiver_id": "640aafb8a4d96f9c88e1e2a2",
        "message": "Hello",
        "message_type": "text"    
      }

      {
        "chat_room_id": "63b32c21dedac0b126bb30fd",
        "sender_id": "64059b1e6b6e26e64c9df0c3",
        "receiver_id": "640aafb8a4d96f9c88e1e2a2",
        "message": "",
        "message_type": "media",
        "image_file":[
            {
                "file_type": "image",
                "file_name": "chat_files/image_2845_1679984879527.jpg"
            },
            {
                "file_type": "video",
                "file_name": "chat_files/video_5577_1679984880988.mp4",
                "thumb_url": "chat_files/thumb_grb_2.png"
            }
        ]
      }
   */
    socket.on("sendMessage", async (data) => {
      // console.log("sendMessage ==> ", data);
      var data = JSON.parse(data);

      // comment after get message event
      socket.join(data.chat_room_id);

      let newMessage = await sendMessage(data);
      v2version.to(data.chat_room_id).emit("sendMessage", newMessage);
    });

    /*  PAYLOAD --> 
      {
        "chat_room_id":"6410186be3474c54ffa81232",
        "user_id":"640aaa6298e44c6535bd8c93",    ==> login_user_id
        "page":"1",
        "limit":"10"
      }
    */
    socket.on("getAllMessage", async (data) => {
      try {
        // console.log("getAllMessage ======== ", data);
        var data = JSON.parse(data);

        socket.join(data.chat_room_id);

        let allMessageList = await getAllMessage(data);
        socket.emit("getAllMessage", allMessageList);
      } catch (error) {
        console.log("=== getAllMessage ===", error.message);
      }
    });

    /*  PAYLOAD --> 
      {
        "chat_room_id":"63c8d2a5d101c9e9f4b71523",
        "user_id":"63c8c46dedf1682155c610f2"    ==> login_user_id
      }
    */
    socket.on("deleteChat", async (data) => {
      try {
        var data = JSON.parse(data);

        let deleteChatData = await deleteChat(data);
        socket.emit("deleteChat", deleteChatData);
      } catch (error) {
        console.log("=== deleteChat ===", error.message);
      }
    });

    /*  PAYLOAD --> 
      {
        "user_id":"63c8c46dedf1682155c610f2",    ==> login_user_id
        "chat_id":"63c8d2a5d101c9e9f4b71523"
      }
    */
    socket.on("deleteOneChat", async (data) => {
      try {
        var data = JSON.parse(data);

        let deleteOneChatData = await deleteOneChat(data);
        socket.emit("deleteOneChat", deleteOneChatData);
      } catch (error) {
        console.log("=== deleteOneChat ===", error.message);
      }
    });

    /*  PAYLOAD --> 
      {
        "chat_room_id":"63c8d2a5d101c9e9f4b71523",
        "user_id":"63c8c46dedf1682155c610f2"    ==> login_user_id
      }
    */
    socket.on("unreadMessage", async (data) => {
      try {
        // console.log("unreadMessage ========== ", data);
        var data = JSON.parse(data);
        if (
          data.chat_room_id != undefined &&
          data.chat_room_id != null &&
          data.chat_room_id != ""
        ) {
          socket.join(data.chat_room_id);
          let updateMessage = await unreadMessageUpdate(data);
          v2version.to(data.chat_room_id).emit("unreadMessage", updateMessage);
        }
      } catch (error) {
        console.log("=== unreadMessage ===", error.message);
      }
    });
  });
};

