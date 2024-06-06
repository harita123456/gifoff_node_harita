const joi = require("joi");

const searchUserListDto = joi.object().keys({
  search_data: joi.string().allow(),
  page: joi.string().allow(),
  limit: joi.string().allow(),
});

const makeFriendDto = joi.object().keys({
  app_version: joi.string().allow().label("App version"),
  user_id: joi.string().allow().label("User id"),
});

const unFriendDto = joi.object().keys({
  friend_id: joi.string().allow(),
  user_id: joi.string().allow(),
});

const sendFriendrequestDto = joi.object().keys({
  user_id: joi.string().required().label("user id"),
  friend_id: joi.string().required().label("friend id"),
});

const accepteclineFriendreqDto = joi.object().keys({
  request_id: joi.string().required().label("request id"),
  request_status: joi.string().required().valid("accepted", "decline"),
});

const cancelfriendRequestDto = joi.object().keys({
  request_id: joi.string().allow(),
  user_id: joi.string().allow(),
});

const requestsListDto = joi.object().keys({
  page: joi.number().allow(),
  limit: joi.number().allow(),
});

// Joi.boolean().required(),
module.exports = {
  searchUserListDto,
  makeFriendDto,
  unFriendDto,
  sendFriendrequestDto,
  accepteclineFriendreqDto,
  cancelfriendRequestDto,
  requestsListDto,
};
