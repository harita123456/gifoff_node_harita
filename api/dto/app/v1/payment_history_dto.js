const joi = require("joi");

const addMembershipDto = joi.object().keys({
  user_id: joi.string().allow().label("user id"),
  payment_status: joi
    .string()
    .required()
    .valid("pending", "success", "failed", "process"),
  amount: joi.string().required().label("amount"),
  membership_type: joi.string().required().valid("subscription", "lifetime"),
  payment_id: joi.string().required().label("payment id"),
  payment_date: joi.date().required().label("payment date"),
  expiry_date: joi.date().allow(),
  payment_json: joi.string().allow(),
});

const checkMembershipDto = joi.object().keys({
  user_id: joi.string().allow().label("user id"),
  //   membership_id: joi.string().required().label("membership id"),
});

const cancelMebershipDto = joi.object().keys({
  user_id: joi.string().allow().label("user id"),
  membership_id: joi.string().required().label("membership id"),
  expiry_date: joi.date().required().label("expiry date"),
});

const removeMebershipDto = joi.object().keys({
  user_id: joi.string().allow(),
});

const updateMebershipDto = joi.object().keys({
  user_id: joi.string().allow().label("user id"),
  membership_id: joi.string().required().label("membership id"),
  expiry_date: joi.date().required().label("expiry date"),
});

// Joi.boolean().required(),
module.exports = {
  addMembershipDto,
  checkMembershipDto,
  cancelMebershipDto,
  updateMebershipDto,
  removeMebershipDto,
};
