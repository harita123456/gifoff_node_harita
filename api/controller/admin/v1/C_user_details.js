const {
  successRes,
  errorRes,
  multiSuccessRes,
} = require("../../../../utils/common_fun");
const users = require("../../../models/M_user");

const friends = require("../../../models/M_friends");

// const {
//   securePassword,
//   comparePassword,
// } = require("../../../../utils/secure_pwd");

// const {
//   notificationSend,
//   notiSendMultipleDevice,
// } = require("../../../../utils/notification_send");

// const { dateTime } = require("../../../../utils/date_time");
// const { sendOtpCode } = require("../../../../utils/send_mail");
// // const { userToken } = require("../../../../utils/token");

// const fs = require("fs");
// var nodemailer = require("nodemailer");
// const mongoose = require("mongoose");
// const moment = require("moment-timezone");
// const ObjectId = require("mongodb").ObjectId;

const userList = async (req, res) => {
  try {
    let find_user = await users
      .find({
        is_deleted: false,
        user_type: "user",
      })
      .sort({ createdAt: -1 });

    let find_user_count = await users
      .find({
        is_deleted: false,
        user_type: "user",
      })
      .count();

    find_user?.forEach((user) => {
      if (user?.profile_picture) {
        user.profile_picture = process.env.BASE_URL + user.profile_picture;
      }
    });

    if (find_user) {
      return multiSuccessRes(
        res,
        "User data get successfully",
        find_user,
        find_user_count
      );
    }
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal Server Error!");
  }
};

const getUserdetails = async (req, res) => {
  try {
    var { user_id } = req.body;
    if (user_id) {
      var find_user = await users
        .findById(user_id)
        .where({ is_deleted: false });

      if (!find_user) {
        return errorRes(res, "Couldn't found user");
      }

      if (find_user?.profile_picture) {
        find_user.profile_picture =
          process.env.BASE_URL + find_user.profile_picture;
      }

      var friend_count  = await friends.countDocuments({user_id:user_id,
      is_deleted:false})

      find_user =
      {
        ...find_user._doc,
        friend_count:friend_count
      }
        
      return successRes(res, `User details get successfully`, find_user);
    }
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal Server Error!");
  }
};

const blockUser = async (req, res) => {
  try {
    var { user_id } = req.body;

    if (user_id) {
      var find_user = await users.findById(user_id);

      if (!find_user) {
        return errorRes(res, "Could't found user");
      }
      if (find_user?.is_block == false || find_user?.is_block == "false") {
        let update_user = await users.findByIdAndUpdate(
          { _id: user_id },
          { $set: { is_block: true } },
          {
            new: true,
          }
        );
        return successRes(res, `Account block successfully`, update_user);
      } else {
        let update_user = await users.findByIdAndUpdate(
          { _id: user_id },
          { $set: { is_block: false } },
          {
            new: true,
          }
        );
        return successRes(res, `Account unblock successfully`, update_user);
      }
    }
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal Server Error!");
  }
};

const deleteUser = async (req, res) => {
  try {
    var { user_id } = req.body;

    if (user_id) {
      var find_user = await users.findById(user_id);

      if (!find_user) {
        return errorRes(res, "Could't found user");
      }

      await users.findByIdAndUpdate(
        { _id: user_id },
        { $set: { is_deleted: true } },
        {
          new: true,
        }
      );
      return successRes(res, `User deleted successfully`, []);
    }
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal Server Error!");
  }
};

const friendsList = async (req, res) =>
{
  try {
    var { user_id } = req.body;

    var friend_list = await friends.find({user_id:user_id,
      is_deleted:false}).populate({
        path: "user_id",
        select: "name profile_picture profile_url is_block",
      })
      .populate({
        path: "friend_id",
        select: "name profile_picture profile_url is_block",
      });


      friend_list?.forEach((value) => {
        if (value?.user_id?.profile_picture &&
          !value?.user_id?.profile_picture.startsWith(process.env.BASE_URL)) {
          value.user_id.profile_picture =
            process.env.BASE_URL + value.user_id.profile_picture
        }

        if (value?.friend_id?.profile_picture &&
          !value?.friend_id?.profile_picture.startsWith(process.env.BASE_URL)) {
          value.friend_id.profile_picture =
            process.env.BASE_URL + value.friend_id.profile_picture
        }
      })
  

    var friend_list_count  = await friends.countDocuments({user_id:user_id,
      is_deleted:false})
      return multiSuccessRes(res, `Friends list get successfully`, friend_list,friend_list_count);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal Server Error!");
  }
}

module.exports = {
  userList,
  getUserdetails,
  blockUser,
  deleteUser,
  friendsList
};
