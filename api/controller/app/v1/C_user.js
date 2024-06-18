const users = require("../../../models/M_user");
const user_session = require("../../../models/M_user_session");
const categories = require("../../../models/M_categories");
const clues = require("../../../models/M_clues");
const friends = require("../../../models/M_friends");
const request = require("../../../models/M_request");
const games = require("../../../models/M_games");

//testing
// const util = require("util");

const { userToken } = require("../../../../utils/token");
const {
  successRes,
  errorRes,
  // multiSuccessRes,
} = require("../../../../utils/common_fun");
const { sendOtpCode, sendSupportMail } = require("../../../../utils/send_mail");
const fs = require("fs");
const path = require("path");
const outputPath = path.join(__dirname, "../../../../");
const {
  securePassword,
  comparePassword,
} = require("../../../../utils/secure_pwd");

// const {
//   notificationSend,
//   notiSendMultipleDevice,
// } = require("../../../../utils/notification_send");
// const { ObjectId } = require("mongodb");

const signup = async (req, res) => {
  try {
    var {
      user_type,
      email_address,
      password,
      is_social_login,
      social_platform,
      social_id,
      profile_url,
      device_token,
      device_type,
    } = req.body;
    let find_email = await users.findOne({
      email_address: email_address,
      is_deleted: false,
    });
    if (find_email) {
      return errorRes(res, "This email address is already exists");
    }

    var insert_data = {};
    /*    if (location) {
      location = JSON.parse(location);
      insert_data = {
        ...insert_data._doc,
        location: location,
        // user_type: user_type,
      };
    } */
    if (email_address) {
      insert_data = {
        ...insert_data._doc,
        user_type,
        email_address,
        password,
        is_login: true,
      };
    }

    if (password) {
      const hashedPassword = await securePassword(password);

      insert_data = {
        ...insert_data,
        password: hashedPassword,
      };
    }

    if (is_social_login == "true" || is_social_login == true) {
      insert_data = {
        ...insert_data,
        profile_url,
        is_social_login: true,
        social_id,
        social_platform,
      };
    }
    console.log("insert_data", insert_data);
    var create_user = await users.create(insert_data);

    var token = await userToken(create_user);

    await user_session.findOneAndUpdate(
      {
        device_token: device_token,
        user_id: create_user._id,
      },
      {
        $set: {
          device_token: device_token,
          device_type: device_type,
          user_type: user_type,
          auth_token: token,
          user_id: create_user._id,
        },
      },
      { new: true, upsert: true }
    );

    create_user = {
      ...create_user._doc,
      token: token,
    };
    return successRes(res, `User signup successfully`, create_user);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const signIn = async (req, res) => {
  try {
    var {
      email_address,
      password,
      device_type,
      device_token,
      is_social_login,
      social_platform,
      social_id,
      name,
      profile_url,
    } = req.body;

    console.log("req.body", req.body);

    if (is_social_login == true || is_social_login == "true") {
      let find_user = await users.findOne({
        email_address: email_address,
        is_deleted: false,
      });

      // update
      if (find_user) {
        if (find_user.social_platform != undefined) {
          if (find_user.social_platform != social_platform) {
            return errorRes(
              res,
              "You already used this email. Please login with " +
                find_user.social_platform
            );
          }
        }
        if (find_user.is_block == true || find_user.is_block == "true") {
          return errorRes(
            res,
            "This account is blocked, Please contact to administrator"
          );
        }

        let token = await userToken(find_user);

        var update_data;

        update_data = {
          ...update_data,
          is_login: true,
          profile_url,
          is_social_login: true,
          social_id,
          social_platform,
        };

        var update_user = await users.findByIdAndUpdate(
          find_user._id,
          update_data,
          { new: true }
        );

        var user_data = {
          ...update_user._doc,
          token: token,
        };

        find_user.token = token;
      } else {
        // create

        let check_user_email = await users.find({
          email_address: email_address,
          is_deleted: false,
        });

        if (check_user_email.length > 0) {
          return await errorRes(
            res,
            "Email already exist, you can try signing with another email"
          );
        } else {
          var insert_data = {
            name,
            email_address,
            password: null,
            profile_url,
            is_social_login: true,
            social_id,
            social_platform,
            is_login: true,
          };

          let create_user = await users.create(insert_data);
          if (create_user) {
            let token = await userToken(create_user);

            user_data = {
              ...create_user._doc,
              token: token,
            };
          }
        }
      }
    } else {
      let find_user = await users.findOne({
        email_address: email_address,
        is_deleted: false,
      });

      if (!find_user) {
        return errorRes(res, `Account is not found, Please try again.`);
      }

      if (find_user.is_block == true || find_user.is_block == "true") {
        return errorRes(
          res,
          `This account is blocked, Please contact to administrator`
        );
      }
      //change
      if (find_user.password == null) {
        return errorRes(
          res,
          `Either email or password you entered is incorrect`
        );
      }

      var password_verify = await comparePassword(password, find_user.password);

      if (!password_verify) {
        return errorRes(
          res,
          `Either email or password you entered is incorrect`
        );
      }

      let token = await userToken(find_user);

      let update_data = {
        is_login: true,
        is_social_login: false,
      };

      var user_updated_data = await users.findByIdAndUpdate(
        find_user._id,
        update_data,
        { new: true }
      );

      user_data = {
        ...user_updated_data._doc,
        token: token,
      };

      find_user.token = token;

      delete user_data.password;
    }
    await user_session.findOneAndUpdate(
      {
        device_token: device_token,
        user_id: user_data._id,
      },
      {
        $set: {
          device_token: device_token,
          device_type: device_type,
          user_id: user_data._id,
          auth_token: token,
        },
      },
      { new: true, upsert: true }
    );
    if (user_data?.profile_picture) {
      user_data.profile_picture =
        process.env.BASE_URL + user_data.profile_picture;
    }
    return successRes(res, `You have login successfully `, user_data);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

// send OTP mail for forgot password
const sendOTP = async (req, res) => {
  try {
    let { email_address } = req.body;

    let otp = Math.floor(1000 + Math.random() * 9000);

    let user_data = await users.findOne({
      email_address,
      is_deleted: false,
    });

    if (!user_data) {
      return errorRes(res, `Account is not found, Please try again.`);
    }

    let data = {
      otp,
      emailAddress: email_address,
      name: user_data.name,
    };

    await sendOtpCode(data);

    let update_data = {
      otp,
    };

    await users.findByIdAndUpdate(user_data._id, update_data);

    return successRes(res, `Verification code sent to your email`, otp);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

// verify OTP for forgot password
const verifyOtp = async (req, res) => {
  try {
    var { email_address, otp } = req.body;

    let find_user = await users
      .findOne({
        email_address: email_address,
      })
      .where({
        is_deleted: false,
      });

    if (!find_user) {
      return errorRes(res, `Account is not found, Please try again.`);
    }

    if (find_user.otp == otp) {
      let update_data = {
        otp: null,
      };

      await users.findByIdAndUpdate(find_user._id, update_data, {
        new: true,
      });

      return successRes(res, `Email verified successfully`);
    } else {
      return errorRes(res, `Please enter correct verification code`);
    }
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const resetPassword = async (req, res) => {
  try {
    let { email_address, password } = req.body;

    const hashedPassword = await securePassword(password);

    let find_user = await users.findOne({
      email_address,
      is_deleted: false,
    });

    if (!find_user) {
      return errorRes(res, `Account is not found, Please try again.`);
    }

    let update_data = {
      password: hashedPassword,
    };

    await users.findByIdAndUpdate(find_user._id, update_data, {
      new: true,
    });

    return successRes(res, `Password reset successfully`);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const checkEmail = async (req, res) => {
  try {
    var { email_address } = req.body;

    let find_user = await users.findOne({
      email_address: email_address,
      is_deleted: false,
    });

    if (!find_user) {
      return successRes(res, `You can register with this email`);
    } else {
      return errorRes(res, `Email is already exists`);
    }
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const changePassword = async (req, res) => {
  try {
    let { old_password, new_password } = req.body;
    let { _id, password } = req.user;

    if (password == null) {
      return errorRes(res, `Your old password is wrong. please try again.`);
    }

    var password_verify = await comparePassword(old_password, password);

    if (!password_verify) {
      return errorRes(res, `Your old password is wrong. please try again.`);
    }
    const hashedPassword = await securePassword(new_password);

    var find_user = await users.findById(_id).where({
      is_deleted: false,
      is_block: false,
    });
    if (find_user.password == hashedPassword) {
      return errorRes(
        res,
        `Your old password is similar to the your new password.`
      );
    }

    let update_data = {
      password: hashedPassword,
    };

    await users.findByIdAndUpdate(_id, update_data);

    return successRes(res, `Your password has been updated successfully`);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const deleteAccount = async (req, res) => {
  try {
    let user_id = req.user._id;

    let update_data = {
      is_deleted: true,
    };
    var updated = await users.findByIdAndUpdate(user_id, update_data);

    if (updated) {
      return successRes(res, `Your account deleted successfully`);
    }
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const logout = async (req, res) => {
  try {
    let user_id;
    if (!req.body.user_id) {
      user_id = req.user._id;
    } else {
      user_id = req.body.user_id;
    }

    var find_data = await users.findById({ _id: user_id }).where({
      is_block: false,
      is_deleted: false,
    });

    if (!find_data) {
      return errorRes(res, "Couldn't found user");
    } else {
      var update_user = await users.updateOne(
        { _id: user_id },
        {
          $set: {
            is_login: false,
          },
        },
        { new: true }
      );

      await user_session.deleteMany({ user_id: user_id });

      if (update_user) {
        return successRes(res, "Your account is logout successfully", []);
      }
    }
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const getProfile = async (req, res) => {
  try {
    let user_id;
    if (!req.body.user_id) {
      user_id = req.user._id;
    } else {
      user_id = req.body.user_id;
    }

    var find_user = await users
      .findById(user_id)
      .where({ is_deleted: false, is_block: false });

    if (!find_user) {
      return errorRes(res, "Couldn't found user");
    }

    if (find_user?.profile_picture) {
      // reportuser

      find_user.profile_picture =
        process.env.BASE_URL + find_user.profile_picture;
    }

    let find_friend = await friends.findOne({
      user_id: req.user._id,
      friend_id: user_id,
      is_deleted: false,
    });

    if (find_friend) {
      find_user = {
        ...find_user._doc,
        is_frined: true,
        is_requested: false,
        request_id: null,
        friend_id: find_friend._id,
      };
    } else {
      let find_other_friend = await friends.findOne({
        user_id: user_id,
        friend_id: req.user._id,
        is_deleted: false,
      });

      if (find_other_friend) {
        find_user = {
          ...find_user._doc,
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
          user_id: req.user._id,
          friend_id: user_id,
        });

          let is_requested,request_id;
        if (find_request) {
          is_requested = true;
          request_id = find_request._id;
        } else {
          is_requested = false;
          request_id = null;
        }

        find_user = {
          ...find_user._doc,
          is_frined: false,
          is_requested: is_requested,
          request_id: request_id,
        };
      }
    }

    return successRes(res, `User details get successfully`, find_user);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const editProfile = async (req, res) => {
  try {
    let user_id;
    if (!req.body.user_id) {
      user_id = req.user._id;
    } else {
      user_id = req.body.user_id;
    }
    var { name, dob, bio } = req.body;
    var { profile_picture } = req.files;
    var find_user = await users
      .findById(user_id)
      .where({ is_deleted: false, is_block: false });
    if (!find_user) {
      return errorRes(res, "Couldn't found user");
    }

    var find_user_name = await users
      .findOne({ name: name, _id: { $ne: user_id } })
      .where({ is_deleted: false });
    if (find_user_name) {
      return errorRes(
        res,
        "You can't use this name because it's already taken"
      );
    }

    var insertdata;
    if (profile_picture) {
      let file_extension = profile_picture.originalFilename
        .split(".")
        .pop()
        .toLowerCase();

      var file_name =
        Math.floor(1000 + Math.random() * 9000) +
        "_" +
        Date.now() +
        "." +
        file_extension;

      // Upload file into folder
      let oldPath = profile_picture.path;
      let newPath = "public/profile_picture/" + file_name;

      await fs.readFile(oldPath, function (err, data) {
        if (err) throw err;

        fs.writeFile(newPath, data, function (err) {
          if (err) throw err;
        });
      });

      await fs.unlink(
        `${outputPath}public/${find_user.profile_picture}`,
        (err) => {
          // if (err) throw err;
          if (err) console.log(err);
        }
      );

      insertdata = {
        ...insertdata,
        profile_picture: "profile_picture/" + file_name,
      };
    }
    insertdata = {
      ...insertdata,
      name,
      dob,
      bio,
    };
    var updated_data = await users.findByIdAndUpdate(
      { _id: user_id },
      { $set: insertdata },
      { new: true }
    );
    if (updated_data?.profile_picture) {
      updated_data.profile_picture =
        process.env.BASE_URL + updated_data.profile_picture;
    }
    if (updated_data) {
      return successRes(res, "Your account updated successfully", updated_data);
    }
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const categoryList = async (req, res) => {
  try {
    const categoriesList = await categories
      .find({ is_deleted: false })
      .sort({ is_premium: 1 });

    var category_list = await Promise.all(
      categoriesList.map(async (value, res) => {
        // var findPlayerInMatch = await games
        //   .findById(value._id)
        //   .where({ is_deleted: false, players_ids: user_id });

        // if (findPlayerInMatch) {
        value = { ...value._doc, is_purchased: false };
        // } else {
        //   value = { ...value._doc, is_purchased: false };
        // }

        if (value?.category_image) {
          value.category_image = process.env.BASE_URL + value.category_image;
        }

        return value;
      })
    );

    return successRes(res, "Categories retrieved successfully", category_list);
  } catch (error) {
    console.log("Error: ", error);
    return errorRes(res, "Internal server error");
  }
};

const clueList = async (req, res) => {
  try {
    let { category_id } = req.body;

    const clue_list = await clues
      .find({
        is_deleted: false,
        category_id: category_id,
      })
      .sort({ createdAt: -1 });

    return successRes(res, "Clue retrieved successfully", clue_list);
  } catch (error) {
    console.log("Error: ", error);
    return errorRes(res, "Internal server error");
  }
};

const uploadGIF = async (req, res) => {
  try {
    var { gif_file } = req.files;

    // console.log({ gif_file });

    let file_extension = gif_file.originalFilename
      .split(".")
      .pop()
      .toLowerCase();

    var file_name =
      Math.floor(1000 + Math.random() * 9000) +
      "_" +
      Date.now() +
      "." +
      file_extension;

    // Upload file into folder
    let oldPath = gif_file.path;
    let newPath = "public/gif_storage/" + file_name;

    await fs.readFile(oldPath, function (err, data) {
      if (err) throw err;

      fs.writeFile(newPath, data, function (err) {
        if (err) throw err;
      });
    });

    var response_data = {
      gif_name: "gif_storage/" + file_name,
      gif_url: process.env.BASE_URL + "gif_storage/" + file_name,
    };

    return successRes(res, "GIF uploaded successfully", response_data);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const contactSupport = async (req, res) => {
  try {
    var { subject, message } = req.body;
    // var user_id = req.user._id;
    var user_name = req.user.name;
    var email_address = req.user.email_address;

    let data = {
      subject: subject,
      message: message,
      user_name,
      email_address: email_address,
    };

    sendSupportMail(data);

    return successRes(res, `Request sent successfully.`, []);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const privacyPolicy = async (req, res) => {
  try {
    let data = {
      privacy_policy: process.env.PRIVACY_POLICY,
      terms_and_conditions: process.env.TERMS_AND_CONDITIONS,
    };
    return successRes(
      res,
      `Privacy policy and Terms and conditions get successfully.`,
      data
    );
  } catch (error) {
    console.log(error);
    return errorRes(res, "Internal Server Error!");
  }
};

const checkMatchPlayers = async (req, res) => {
  const { game_id } = req.body;
  try {
    const updateResult = await games.findByIdAndUpdate(
      game_id,
      { $push: { players_ids: req.user.id } }, // Use $push to add user ID to players_ids
      { new: true } // Return the updated document
    );

    if (
      !updateResult ||
      updateResult.players_ids.length > updateResult.players
    ) {
      await games.findByIdAndUpdate(
        game_id,
        { $pull: { players_ids: req.user.id } }, // Use $pull to remove user ID to players_ids
        { new: true } // Return the updated document
      );

      return errorRes(
        res,
        "You can't join this game because there are no more players required"
      );
    } else {
      await games.findByIdAndUpdate(
        game_id,
        { $pull: { players_ids: req.user.id } }, // Use $pull to remove user ID to players_ids
        { new: true } // Return the updated document
      );
    }

    console.log("Added players: ", updateResult.players_ids.length);
    console.log("Required players: ", updateResult.players);

    return successRes(res, "You can join this game", { is_join: true });
  } catch (error) {
    console.log(error);
    return errorRes(res, "Internal Server Error!");
  }
};

module.exports = {
  signup,
  sendOTP,
  verifyOtp,
  resetPassword,
  checkEmail,
  signIn,
  changePassword,
  deleteAccount,
  logout,
  getProfile,
  editProfile,
  categoryList,
  clueList,
  uploadGIF,
  contactSupport,
  privacyPolicy,
  checkMatchPlayers,
};
