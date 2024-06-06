const {
  successRes,
  errorRes,
  multiSuccessRes,
} = require("../../../../utils/common_fun");
const users = require("../../../models/M_user");
const user_session = require("../../../models/M_user_session");
const categories = require("../../../models/M_categories");
const games = require("../../../models/M_games");
const {
  securePassword,
  comparePassword,
} = require("../../../../utils/secure_pwd");

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
const ObjectId = require("mongodb").ObjectId;

const adminSignUp = async (req, res) => {
  try {
    let { email_address, password, device_type, device_token, user_type } =
      req.body;

    let check_user_email = await users.find({
      email_address: email_address,
      is_deleted: false,
    });

    if (check_user_email.length > 0) {
      return errorRes(res, "Email already exist");
    }

    const hashedPassword = await securePassword(password);
    var insert_admin_data = {
      email_address,
      password: hashedPassword,
      user_type,
    };

    var create_admin = await users.create(insert_admin_data);
    let update_signup_data = {
      is_login: true,
    };

    var update_user = await users.findByIdAndUpdate(
      { _id: create_admin._id },
      { $set: update_signup_data },
      {
        new: true,
      }
    );

    var token = await userToken(create_admin);
    update_user = {
      ...update_user._doc,
      token: token,
    };

    update_user.token = token;

    let session = await user_session.findOneAndUpdate(
      {
        device_token: device_token,
        user_id: create_admin._id,
      },
      {
        $set: {
          device_token: device_token,
          device_type: device_type,
          auth_token: update_user.token,
          user_type: user_type,
          user_id: create_admin._id,
        },
      },
      { new: true, upsert: true }
    );

    return successRes(res, `Admin created successfully`, update_user);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, " Internal server error");
  }
};

const adminLogin = async (req, res) => {
  try {
    let { email_address, password, device_type, device_token, user_type } =
      req.body;

    var find_admin = await users.findOne({
      email_address: email_address,
      is_deleted: false,
    });

    if (!find_admin) {
      return errorRes(res, `No account found with this email`);
    }

    var password_verify = await comparePassword(password, find_admin.password);

    if (!password_verify) {
      return errorRes(res, `Your password wrong, please check it`);
    }

    var token = await userToken(find_admin);

    let update_login_data = {
      is_login: true,
    };

    var login_updated_data = await users.findByIdAndUpdate(
      find_admin._id,
      update_login_data,
      { new: true }
    );

    // var token = await userToken(login_updated_data);

    login_updated_data = {
      ...login_updated_data._doc,
      token: token,
    };

    find_admin.token = token;

    delete find_admin.password;
    let session = await user_session.findOneAndUpdate(
      {
        device_token: device_token,
        user_id: find_admin._id,
      },
      {
        $set: {
          device_token: device_token,
          device_type: device_type,
          auth_token: find_admin.token,
          user_type: user_type,
          user_id: find_admin._id,
        },
      },
      { new: true, upsert: true }
    );
    return successRes(res, `Admin login successfully`, login_updated_data);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, " Internal server error");
  }
};

const sendOTP = async (req, res) => {
  try {
    let { email_address } = req.body;

    let otp = Math.floor(1000 + Math.random() * 9000);

    let login_data = await users.findOne({
      email_address,
      is_deleted: false,
    });

    if (!login_data) {
      return errorRes(res, `No account found with this email`);
    }

    let data = {
      otp,
      emailAddress: email_address,
      name: login_data.name,
    };

    await sendOtpCode(data);

    let update_data = {
      otp,
    };
    await users.findByIdAndUpdate(login_data._id, update_data);

    return successRes(
      res,
      `Successfully ! send verification code to your email`,
      otp
    );
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, " Internal server error");
  }
};

const email_testing = async (req, res) => {
  try {
    let { email_address, html } = req.body;

    let otp = Math.floor(1000 + Math.random() * 9000);

    console.log("email_address ======= ", email_address);

    var transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST, //smtp.gmail.com
      port: process.env.MAIL_PORT, //587
      // secure: false, // Use SSL
      auth: {
        user: process.env.MAIL_FROM_ADDRESS,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    var sendOtp = {
      from: process.env.MAIL_FROM_ADDRESS,
      to: email_address,
      subject: "testing",
      html: `${html}`,
    };

    var work = await transporter.sendMail(sendOtp);

    return successRes(
      res,
      `Successfully ! send verification code to your email`,
      work
    );
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, " Internal server error");
  }
};

const verifyOtp = async (req, res) => {
  try {
    let { email_address, otp } = req.body;

    let find_admin = await users
      .findOne({ email_address: email_address })
      .where({
        is_deleted: false,
      });

    if (!find_admin) {
      return errorRes(res, `No account found with this email`);
    }
    if (find_admin.otp == otp) {
      let update_data = {
        otp: null,
      };

      await users.findByIdAndUpdate(find_admin._id, update_data, {
        new: true,
      });

      return successRes(res, `OTP verified successfully`);
    } else {
      return errorRes(res, `Please enter valid OTP`);
    }
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, " Internal server error");
  }
};

const resetPassword = async (req, res) => {
  try {
    console.log("resetPassword");
    let { email_address, password } = req.body;

    let find_admin = await users.findOne({
      email_address,
      is_deleted: false,
    });

    if (!find_admin) {
      return errorRes(res, `No account found with this email`);
    }

    const hashedPassword = await securePassword(password);

    let update_data = {
      password: hashedPassword,
    };

    await users.findByIdAndUpdate(find_admin._id, update_data, {
      new: true,
    });

    return successRes(res, `Password reset successfully`);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, " Internal server error");
  }
};

const changePassword = async (req, res) => {
  try {
    let { old_password, new_password } = req.body;
    let { _id, password } = req.user;

    var password_verify = await comparePassword(old_password, password);

    if (!password_verify) {
      return errorRes(
        res,
        `Your current password is incorrect, please try again`
      );
    }
    const hashedPassword = await securePassword(new_password);

    var find_admin = await users.findById(_id).where({
      is_deleted: false,
      is_block: false,
    });
    if (find_admin.password == hashedPassword) {
      return errorRes(
        res,
        `Your new password is similar to your current password, please try another password`
      );
    }

    let update_data = {
      password: hashedPassword,
    };

    await users.findByIdAndUpdate(_id, update_data);

    return successRes(res, `Your password has been updated successfully`);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, " Internal server error");
  }
};

const logout = async (req, res) => {
  try {
    if (!req.body.user_id) {
      var user_id = req.user._id;
    } else {
      var user_id = req.body.user_id;
    }

    var find_admin = await users.findById(user_id).where({
      is_block: false,
      is_deleted: false,
    });

    if (!find_admin) {
      return errorRes(res, "Couldn't found user");
    } else {
      var update_user = await users.updateOne(
        { _id: user_id },
        {
          $set: {
            device_token: null,
            device_type: null,
            is_login: false,
          },
        },
        { new: true }
      );

      if (update_user) {
        return successRes(res, "Your account is logout successfully", []);
      }
    }
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, " Internal server error");
  }
};

const dashboard = async (req, res) => {
  try {
    let adminDashboard = {
      users: 0,
      games: 0,
      category: 0,
    };

    let find_user = await users
      .find({
        is_deleted: false,
        user_type: "user",
      })
      .count();

    if (find_user > 0) {
      adminDashboard = { ...adminDashboard, users: find_user };
    }

    let find_categories = await categories
      .find({
        is_deleted: false,
      })
      .count();

    if (find_categories > 0) {
      adminDashboard = { ...adminDashboard, category: find_categories };
    }


    let find_game = await games
      .find({
        is_deleted: false,
      })
      .count();
    if (find_game > 0) {
      adminDashboard = { ...adminDashboard, games: find_game };
    }


    return successRes(res, `Dashboard data get successfully`, adminDashboard);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal Server Error!");
  }
};

module.exports = {
  adminSignUp,
  adminLogin,
  sendOTP,
  verifyOtp,
  resetPassword,
  changePassword,
  logout,
  email_testing,
  dashboard,
};
