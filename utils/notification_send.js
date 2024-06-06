const axios = require("axios");

const notificationSend = async (data) => {
  // Send push notification code.
  const {
    device_token,
    noti_title,
    noti_msg,
    noti_for,
    id,
    noti_image,
    details,
  } = data;

  let messageBody = {
    title: noti_title,
    body: noti_msg,
    noti_for: noti_for,
    id: id,
  };

  if (details != undefined) {
    messageBody = { ...messageBody, details: details };
  }

  let noti_payload = {
    title: noti_title,
    body: noti_msg,
    data: messageBody,
    sound: "default",
  };

  messageBody = { ...messageBody, body: noti_msg, title: noti_title };

  if (noti_image != undefined) {
    noti_payload = { ...noti_payload, image: noti_image };
  }

  // image:
  //     "https://i.picsum.photos/id/528/200/300.jpg?hmac=nQ5klrDwddW0du03zqKfOpyHkFBDaspI729AfK_FXPY",

  const serverKey = process.env.SERVER_KEY;
  const payload = {
    notification: noti_payload,
    data: messageBody,
    title: noti_title,
    to: device_token,
  };

  let response = await axios.post(
    "https://fcm.googleapis.com/fcm/send",
    payload,
    {
      headers: {
        Authorization: `Bearer ${serverKey}`,
      },
    }
  );

  return response;
};

const notiSendMultipleDevice = async (data) => {
  // Send push notification code.
  const {
    device_token,
    noti_title,
    noti_msg,
    noti_for,
    id,
    noti_image,
    details,
  } = data;

  let messageBody = {
    title: noti_title,
    body: noti_msg,
    noti_for: noti_for,
    sound: "default",
    id: id,
  };

  if (details != undefined) {
    messageBody = { ...messageBody, details: details };
  }

  let noti_payload = {
    title: noti_title,
    body: noti_msg,
  };

  // if (noti_image != undefined) {
  //   noti_payload = { ...noti_payload, image: noti_image };
  // }

  messageBody = { ...messageBody, body: noti_msg };

  const serverKey = process.env.SERVER_KEY;
  const payload = {
    notification: noti_payload,
    data: messageBody,
    title: noti_title,
    registration_ids: device_token,
  };

  let response = await axios.post(
    "https://fcm.googleapis.com/fcm/send",
    payload,
    {
      headers: {
        Authorization: `Bearer ${serverKey}`,
      },
    }
  );
  return response;
};

module.exports = { notificationSend, notiSendMultipleDevice };
