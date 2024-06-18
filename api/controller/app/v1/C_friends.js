const users = require("../../../models/M_user");
const user_session = require("../../../models/M_user_session");
// const clues = require("../../../models/M_clues");
const friends = require("../../../models/M_friends");
const request = require("../../../models/M_request");
//testing
// const util = require("util");

const {
  successRes,
  errorRes,
  multiSuccessRes,
} = require("../../../../utils/common_fun");

// const path = require("path");

const {
  // notificationSend,
  notiSendMultipleDevice,
} = require("../../../../utils/notification_send");


const searchUserList = async (req, res) => {
  try {
    let user_id = req.user._id;

    let { search_data, page = 1, limit = 10 } = req.body;

    let whereCond = {
      is_deleted: false,
      is_block: false,
      _id: { $ne: user_id },
    };

    if (search_data != undefined && search_data != "" && search_data != null) {
      whereCond = {
        ...whereCond,
        name: { $regex: search_data, $options: "i" },
      };
    }

    let find_user = await users
      .find(whereCond)
      .select(
        "name profile_picture profile_url is_block is_deleted is_self_delete"
      )
      .limit(limit)
      .skip((page - 1) * limit);

    var user_list = await Promise.all(
      find_user.map(async (user, res) => {
        let find_friend = await friends.findOne({
          user_id: user_id,
          friend_id: user._id,
          is_deleted: false,
        });

        if (find_friend) {
          user = {
            ...user._doc,
            is_frined: true,
            is_requested: false,
            request_id: null,
            friend_id: find_friend._id,
          };
        } else {
          let find_other_friend = await friends.findOne({
            user_id: user._id,
            friend_id: user_id,
            is_deleted: false,
          });

          if (find_other_friend) {
            user = {
              ...user._doc,
              is_frined: true,
              is_requested: false,
              request_id: null,
              friend_id: find_other_friend._id,
            };
          } else {
            // add request sended or not
            let find_request = await request.findOne().where({
              is_deleted: false,
              request_status: "sent",
              user_id: user_id,
              friend_id: user._id,
            });

            let is_requested;
            let request_id;

            if (find_request) {
              is_requested = true;
              request_id = find_request._id;
            } else {
              is_requested = false;
              request_id = null;
            }

            let other_friend_request = await request.findOne().where({
              is_deleted: false,
              request_status: "sent",
              user_id: user._id,
              friend_id: user_id,
            });

            let is_other_requested;

            if (other_friend_request) {
              is_other_requested = true;
              request_id = other_friend_request._id;
            } else {
              is_other_requested = false;
              request_id = null;
            }

            user = {
              ...user._doc,
              is_frined: false,
              is_requested: is_requested,
              request_id: request_id,
              is_other_requested: is_other_requested,
            };
          }
        }

        if (user?.profile_picture) {
          user.profile_picture = process.env.BASE_URL + user.profile_picture;
        }

        return user;
      })
    );

    return successRes(res, "User list get successfully", user_list);
  } catch (error) {
    console.log("Error: ", error);
    return errorRes(res, "Internal server error");
  }
};

const makeFriend = async (req, res) => {
  try {
    let { user_id } = req.body;
    let login_user_id = req.user._id;

    let find_user = users
      .findById(user_id)
      .where({ is_deleted: false, is_block: false });

    if (!find_user) {
      return errorRes(res, "Couldn't found user");
    }

    let find_friend = await friends.findOne({
      user_id: login_user_id,
      friend_id: user_id,
      is_deleted: false,
    });

    if (find_friend) {
      return errorRes(res, "You are already friends");
    }

    let create_friend = await friends.create({
      user_id: login_user_id,
      friend_id: user_id,
    });

    return successRes(res, "Make friend successfully", create_friend);
  } catch (error) {
    console.log("Error: ", error);
    return errorRes(res, "Internal server error");
  }
};

const unFriend = async (req, res) => {
  try {
    let { friend_id, user_id } = req.body;
    let login_user_id = req.user._id;

    if (friend_id) {
      let find_friend = await friends.findById(friend_id);

      if (!find_friend) {
        return errorRes(res, "Friend not found");
      }
      await friends.findByIdAndUpdate(friend_id, {
        $set: { is_deleted: true },
      });
    } else {
        await friends.find().where({
        is_deleted: false,
        user_id: login_user_id,
        friend_id: user_id,
      });

      await friends.updateMany(
        { user_id: login_user_id, friend_id: user_id },
        {
          $set: { is_deleted: true },
        },
        { multi: true }
      );
    }

    return successRes(res, "Friend removed successfully", []);
  } catch (error) {
    console.log("Error: ", error);
    return errorRes(res, "Internal server error");
  }
};

const friendList = async (req, res) => {
  try {
    let user_id = req.user._id;

    let { page = 1, limit = 10, search_data } = req.body;

    let deleted_users = await users.find({ is_deleted: true });

    const deleteUserIds = deleted_users?.map((block) => block._id);

    let frnd_cond;

    if (search_data) {
      var searched_user = await users.find({
        is_deleted: false,
        name: { $regex: search_data, $options: "i" },
      }); //g

      var searchedUserIds = searched_user?.map((user) => user._id);

      frnd_cond = { $nin: deleteUserIds, $in: searchedUserIds };
    } else {
      frnd_cond = { $nin: deleteUserIds };
    }

    let friend_list = await friends
      .find()
      .where({
        is_deleted: false,
        $or: [{ user_id: user_id }, { friend_id: user_id }],
        // user_id: user_id,
        friend_id: frnd_cond,
      })
      .populate({
        path: "user_id",
        select: "name profile_picture profile_url is_block membership_type",
      })
      .populate({
        path: "friend_id",
        select: "name profile_picture profile_url is_block membership_type",
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    friend_list?.forEach((user) => {
      if (
        user?.user_id?.profile_picture &&
        !user?.user_id?.profile_picture.startsWith(process.env.BASE_URL)
      ) {
        user.user_id.profile_picture =
          process.env.BASE_URL + user.user_id.profile_picture;
      }
      if (
        user?.friend_id?.profile_picture &&
        !user?.friend_id?.profile_picture.startsWith(process.env.BASE_URL)
      ) {
        user.friend_id.profile_picture =
          process.env.BASE_URL + user.friend_id.profile_picture;
      }
    });

    return successRes(res, "Friends retrieved successfully", friend_list);
  } catch (error) {
    console.log("Error: ", error);
    return errorRes(res, "Internal server error");
  }
};

const sendfriendRequest = async (req, res) => {
  try {
    let { user_id, friend_id } = req.body;
    let login_user_id = req.user._id;

    console.log(req.body);

    let find_login_user = await users
      .findById(login_user_id)
      .where({ is_deleted: false });

    if (!find_login_user) {
      return errorRes(res, `Couldn't found login user`);
    }

    let friend_id_user = await users
      .findById(friend_id)
      .where({ is_deleted: false });

    if (!friend_id_user) {
      return errorRes(res, `Couldn't found friend`);
    }
    var login_user_profile_picture;
    if (find_login_user.profile_url != null) {
      login_user_profile_picture = find_login_user?.profile_url;
    } else {
      login_user_profile_picture =
        process.env.BASE_URL + find_login_user?.profile_picture;
    }

    var find_request = await request.findOne({
      user_id: user_id,
      friend_id: friend_id,
      request_status: "sent",
      is_deleted: false,
    });

    var find_request2 = await request.findOne({
      user_id: friend_id,
      friend_id: user_id,
      request_status: "sent",
      is_deleted: false,
    });

    if (find_request || find_request2) {
      return errorRes(res, "Friend request already sent");
    }

    var create_friend_req = await request.create({
      user_id: user_id,
      friend_id: friend_id,
      request_status: "sent",
    });

    let noti_msg = find_login_user?.name + " has sent a new friend request";
    let noti_title = "New friend request";
    let noti_for = "sent";
    let noti_image = login_user_profile_picture;
    let notiData = {
      noti_image,
      noti_msg,
      noti_title,
      noti_for,
      id: find_login_user._id,
    };

    var find_token = await user_session.find({
      user_id: friend_id,
      is_deleted: false,
    });

    let device_token_array = [];
    for (var value of find_token) {
      var device_token = value.device_token;
      device_token_array.push(device_token);
    }
    if (device_token_array.length > 0) {
      notiData = { ...notiData, device_token: device_token_array };
      await notiSendMultipleDevice(notiData);
    }
    return successRes(
      res,
      "friend request sent successfully",
      create_friend_req
    );
  } catch (error) {
    console.log("Error: ", error);
    return errorRes(res, "Internal server error");
  }
};

const acceptDeclinefrinedRequest = async (req, res) => {
  try {
    let { request_status, request_id } = req.body;
    let login_user_id = req.user._id;

    let find_login_user = await users
      .findById(login_user_id)
      .where({ is_deleted: false });

    if (!find_login_user) {
      return errorRes(res, `Couldn't found login user`);
    }

    let find_request = await request.findById(request_id).where({
      is_deleted: false,
      request_status: { $in: ["sent"] },
    });

    if (!find_request) {
      return errorRes(res, `Couldn't found request`);
    }

    if (request_status == "accepted") {
      let update_request = await request.findByIdAndUpdate(
        {
          _id: request_id,
          request_status: "sent",
        },
        {
          $set: {
            request_status: "accepted",
          },
        },
        {
          new: true,
        }
      );

      let create_friend = await friends.create({
        user_id: update_request?.user_id,
        friend_id: update_request?.friend_id,
      });

      let find_user_id = await users
        .findById(update_request?.user_id)
        .where({ is_deleted: false });

      let find_friend_id = await users
        .findById(update_request?.friend_id)
        .where({ is_deleted: false });

      let friend_user_profile_picture;
      if (find_friend_id?.profile_url != null) {
        friend_user_profile_picture = find_friend_id?.profile_url;
      } else {
        friend_user_profile_picture =
          process.env.BASE_URL + find_friend_id?.profile_picture;
      }

      if (create_friend) {
        let noti_msg = find_friend_id?.name + " has accept your friend request";
        let noti_title = "Accept friend request";
        let noti_for = "accept";
        let noti_image = friend_user_profile_picture;
        let notiData = {
          noti_image,
          noti_msg,
          noti_title,
          noti_for,
          id: find_friend_id?._id,
        };

        let find_token = await user_session.find({
          user_id: find_user_id?._id,
          is_deleted: false,
        });

        let device_token_array = [];
        for (let value of find_token) {
          device_token_array.push(value.device_token);
        }

        if (device_token_array.length > 0) {
          notiData = { ...notiData, device_token: device_token_array };
          await notiSendMultipleDevice(notiData);
        }

        return successRes(
          res,
          "Friend request accepted successfully",
          create_friend
        );
      }
    }

    if (request_status == "decline") {
      let update_request = await request.findByIdAndUpdate(
        {
          _id: request_id,
          request_status: "sent",
        },
        {
          $set: {
            request_status: "decline",
          },
        },
        {
          new: true,
        }
      );

      let find_user_id = await users
        .findById(update_request?.user_id)
        .where({ is_deleted: false });

      let find_friend_id = await users
        .findById(update_request?.friend_id)
        .where({ is_deleted: false });

      let friend_user_profile_picture;
      if (find_friend_id?.profile_url != null) {
        friend_user_profile_picture = find_friend_id?.profile_url;
      } else {
        friend_user_profile_picture =
          process.env.BASE_URL + find_friend_id?.profile_picture;
      }

      let noti_msg = find_friend_id?.name + " has decline your friend request";
      let noti_title = "Decline friend request";
      let noti_for = "decline";
      let noti_image = friend_user_profile_picture;
      let notiData = {
        noti_image,
        noti_msg,
        noti_title,
        noti_for,
        id: find_friend_id?._id,
      };

      let find_token = await user_session.find({
        user_id: find_user_id?._id,
        is_deleted: false,
      });

      let device_token_array = [];
      for (let value of find_token) {
        var device_token = value.device_token;
        device_token_array.push(device_token);
      }

      if (device_token_array.length > 0) {
        notiData = { ...notiData, device_token: device_token_array };
        await notiSendMultipleDevice(notiData);
      }
      return successRes(res, "Friend request decline successfully", []);
    }
  } catch (error) {
    console.log("Error: ", error);
    return errorRes(res, "Internal server error");
  }
};

const cancelfriendRequest = async (req, res) => {
  try {
    let { request_id, user_id } = req.body;
    let login_user_id = req.user._id;

    console.log(req.body);

    let find_login_user = await users
      .findById(login_user_id)
      .where({ is_deleted: false });

    if (!find_login_user) {
      return errorRes(res, `Couldn't found login user`);
    }

    let find_request;

    if (request_id) {
      find_request = await request.findById(request_id).where({
        is_deleted: false,
      });
    } else {
      find_request = await request.findOne().where({
        user_id: login_user_id,
        friend_id: user_id,
        request_status: "sent",
        is_deleted: false,
      });
    }

    if (!find_request) {
      return errorRes(res, `Couldn't found request`);
    }

    let update_request = await request.findByIdAndUpdate(
      find_request._id,
      {
        $set: {
          request_status: "cancel",
        },
      },
      {
        new: true,
      }
    );

    if (update_request) {
      return successRes(res, "Friend request cancel successfully", []);
    }
  } catch (error) {
    console.log("Error: ", error);
    return errorRes(res, "Internal server error");
  }
};

const requestsList = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.body;
    let login_user_id = req.user._id;

    let find_login_user = await users
      .findById(login_user_id)
      .where({ is_deleted: false });

    if (!find_login_user) {
      return errorRes(res, `Couldn't found login user`);
    }

    var find_requests = await request
      .find()
      .where({
        $or: [{ user_id: login_user_id }, { friend_id: login_user_id }],
        is_deleted: false,
        request_status: { $in: ["sent"] },
      })
      .populate({
        path: "user_id",
        select: "name profile_picture profile_url is_block membership_type",
      })
      .populate({
        path: "friend_id",
        select: "name profile_picture profile_url is_block membership_type",
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    let find_requests_count = await request.countDocuments({
      $or: [{ user_id: login_user_id }, { friend_id: login_user_id }],
      is_deleted: false,
      request_status: { $in: ["sent"] },
    });

    if (find_requests?.length > 0) {
      find_requests?.forEach((user) => {
        if (
          user?.user_id?.profile_picture &&
          !user?.user_id?.profile_picture.startsWith(process.env.BASE_URL)
        ) {
          user.user_id.profile_picture =
            process.env.BASE_URL + user.user_id.profile_picture;
        }
        if (
          user?.friend_id?.profile_picture &&
          !user?.friend_id?.profile_picture.startsWith(process.env.BASE_URL)
        ) {
          user.friend_id.profile_picture =
            process.env.BASE_URL + user.friend_id.profile_picture;
        }
      });

      return multiSuccessRes(
        res,
        "Requests list get successfully",
        find_requests,
        find_requests_count
      );
    } else {
      return successRes(res, "Requests list is empty", []);
    }
  } catch (error) {
    console.log("Error: ", error);
    return errorRes(res, "Internal server error");
  }
};

module.exports = {
  searchUserList,
  makeFriend,
  friendList,
  unFriend,
  sendfriendRequest,
  acceptDeclinefrinedRequest,
  cancelfriendRequest,
  requestsList,
};
