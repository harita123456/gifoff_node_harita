const {
  // successRes,
  errorRes,
  multiSuccessRes,
} = require("../../../../utils/common_fun");
// const users = require("../../../models/M_user");
// const user_session = require("../../../models/M_user_session");
const payment_history = require("../../../models/M_payment_history");

// const friends = require("../../../models/M_friends");

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
// const { userToken } = require("../../../../utils/token");

const transactionList = async (req, res) => {
  try {
    var transaction_list = await payment_history
      .find({ is_deleted: false })
      .populate({
        path: "user_id",
        select: "name profile_picture profile_url is_block",
      })
      .sort({ createdAt: -1 });

    transaction_list?.forEach((value) => {
      if (
        value?.user_id?.profile_picture &&
        !value?.user_id?.profile_picture.startsWith(process.env.BASE_URL)
      ) {
        value.user_id.profile_picture =
          process.env.BASE_URL + value.user_id.profile_picture;
      }
    });

    var transaction_list_count = await payment_history
      .find({
        is_deleted: false,
      })
      .count();

    return multiSuccessRes(
      res,
      `Transaction list get successfully`,
      transaction_list,
      transaction_list_count
    );
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal Server Error!");
  }
};

module.exports = {
  transactionList,
};
