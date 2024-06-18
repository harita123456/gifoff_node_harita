const users = require("../../../models/M_user");
const payment = require("../../../models/M_payment_history");

// const util = require("util");

const {
  successRes,
  errorRes,
  // multiSuccessRes,
} = require("../../../../utils/common_fun");

// const fs = require("fs");
// const path = require("path");
// const outputPath = path.join(__dirname, "../../../../");

// const {
//   // notificationSend,
//   notiSendMultipleDevice,
// } = require("../../../../utils/notification_send");
// const { ObjectId } = require("mongodb");
// const { dateTime } = require("../../../../utils/date_time");

const addMembership = async (req, res) => {
  try {
    let user_id;
    if (!req.body.user_id) {
      user_id = req.user._id;
    } else {
      user_id = req.body.user_id;
    }
    var {
      payment_status,
      amount,
      membership_type,
      payment_id,
      payment_date,
      expiry_date,
      payment_json,
    } = req.body;

    var find_user = await users.findOne({
      _id: user_id,
      is_deleted: false,
    });

    if (!find_user) {
      return errorRes(res, "Could't found user");
    }
    var insert_data = {
      user_id,
      payment_status,
      amount,
      membership_type,
      payment_id,
      payment_date,
      expiry_date,
    };

    if (payment_json) {
      insert_data = {
        ...insert_data,
        payment_json: JSON.stringify(payment_json),
      };
    }

    var insert_payment = await payment.create(insert_data);

    if (insert_payment) {
      await users.findByIdAndUpdate(
        {
          _id: user_id,
          is_deleted: false,
        },
        {
          $set: {
            membership_type: membership_type,
          },
        },
        {
          new: true,
        }
      );
    }

    return successRes(res, "Add membership successfully", insert_payment);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const checkMembership = async (req, res) => {
  try {
    let user_id;
    if (!req.body.user_id) {
      user_id = req.user._id;
    } else {
      user_id = req.body.user_id;
    }

    var find_user = await users.findOne({
      _id: user_id,
      is_deleted: false,
    });

    if (!find_user) {
      return errorRes(res, "Could't found user");
    }

    var find_membership = await payment
      .findOne({
        // _id: membership_id,
        user_id: user_id,
        is_deleted: false,
      })
      .populate("user_id")
      .sort({ createdAt: -1 });

    if (!find_membership) {
      return errorRes(res, "Could't found membership");
    }

    return successRes(
      res,
      "Membership details get successfully",
      find_membership
    );
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const cancelMebership = async (req, res) => {
  try {

    let user_id;

    if (!req.body.user_id) {
      user_id = req.user._id;
    } else {
      user_id = req.body.user_id;
    }

    var { membership_id, expiry_date } = req.body;

    console.log("cancelMebership - req.body ->>", req.body);

    var find_user = await users.findOne({
      _id: user_id,
      is_deleted: false,
    });

    if (!find_user) {
      return errorRes(res, "Could't found user");
    }

    var update_membership = await payment.findByIdAndUpdate(
      {
        _id: membership_id,
        is_deleted: false,
      },
      {
        $set: {
          expiry_date: expiry_date,
          is_cancel: true,
        },
      },
      {
        new: true,
      }
    );

    return successRes(
      res,
      "Expire date update successfully",
      update_membership
    );
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const removeMebership = async (req, res) => {
  try {
    let user_id;
    if (!req.body.user_id) {
      user_id = req.user._id;
    } else {
      user_id = req.body.user_id;
    }

    console.log("removeMebership - req.body ->>", req.body);

    var update_user = await users.findOneAndUpdate(
      {
        _id: user_id,
        is_deleted: false,
      },
      {
        $set: {
          membership_type: "none",
        },
      },
      {
        new: true,
      }
    );

    if (!update_user) {
      return errorRes(res, "Could't found user");
    }

    return successRes(res, "memebership removed successfully", update_user);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const updateMembership = async (req, res) => {
  try {
    let user_id;
    if (!req.body.user_id) {
      user_id = req.user._id;
    } else {
      user_id = req.body.user_id;
    }

    var { membership_id, expiry_date } = req.body;

    var find_user = await users.findOne({
      _id: user_id,
      is_deleted: false,
    });

    if (!find_user) {
      return errorRes(res, "Could't found user");
    }
    var update_subscription = await payment.findByIdAndUpdate(
      {
        _id: membership_id,
        is_deleted: false,
        is_expire: true,
        membership_type: "subscription",
      },
      {
        $set: {
          is_expire: false,
          expiry_date: expiry_date,
        },
      },
      { new: true }
    );

    if (update_subscription) {
      var update_user = await users.findByIdAndUpdate(
        {
          _id: user_id,
          is_deleted: false,
        },
        {
          $set: {
            membership_type: "subscription",
          },
        },
        {
          new: true,
        }
      );

      if (update_user) {
        return successRes(res, "Expire date update successfully", update_user);
      }
    }
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

module.exports = {
  addMembership,
  checkMembership,
  cancelMebership,
  updateMembership,
  removeMebership,
};
