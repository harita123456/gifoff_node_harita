const joi = require("joi");
joi.objectId = require("joi-objectid")(joi);
const adminSignUpInDto = joi.object().keys({
  email_address: joi.string().email().required().label("Email address"),
  password: joi.string().min(6).required().label("Password"),
  user_type: joi.string().required().valid("admin").label("User type"),
  device_type: joi.string().required().valid("web").label("Device type"),
  device_token: joi.string().required().label("Device token"),
});

const sendOtpDto = joi.object().keys({
  email_address: joi.string().email().required().label("Email address"),
});

const verifyOtpDto = joi.object().keys({
  email_address: joi.string().email().required().label("Email address"),
  otp: joi.string().length(4).required().label("OTP"),
});

const resetPasswordDto = joi.object().keys({
  email_address: joi.string().email().required().label("Email address"),
  password: joi.string().min(6).required().label("Password"),
});

const changePasswordDto = joi.object().keys({
  old_password: joi.string().min(6).required().label("Old password"),
  new_password: joi.string().min(6).required().label("New password"),
});
// ObjectId()

const changeVerificationStatusDto = joi.object().keys({
  user_id: joi.string().allow().label("User id"),
  verified_status: joi
    .string()
    .valid("rejected", "verified")
    .required()
    .label("Verified status"),
});

const addintrestDto = joi.object().keys({
  interestd: joi.string().required().label("Interestd"),
  color_code: joi.string().required().label("Color code"),
});
const editintrestDto = joi.object().keys({
  interest_id: joi.string().required().label("Interest id"),
  interestd: joi.string().required().label("Interestd"),
  color_code: joi.string().required().label("Color code"),
});
const deleteintrestDto = joi.object().keys({
  interest_id: joi.string().required().label("Interest id"),
});
const addsubintrestDto = joi.object().keys({
  interest_id: joi.string().required().label("Interest id"),
  sub_interest: joi.string().required().label("Sub interest"),
});

const editsubintrestDto = joi.object().keys({
  subinterest_id: joi.string().required().label("Sub interest id"),
  sub_interest: joi.string().required().label("Sub interest"),
});
const deletesubintrestDto = joi.object().keys({
  subinterest_id: joi.string().required().label("Sub interest id"),
});

const block_userDto = joi.object().keys({
  user_id: joi.string().allow().label("User id"),
});

const getUserdetailsDto = joi.object().keys({
  user_id: joi.string().allow().label("User id"),
});

const getPostdetailsDto = joi.object().keys({
  post_id: joi.string().required().label("Post id"),
});

const deleteUserDto = joi.object().keys({
  user_id: joi.string().allow().label("User id"),
});

const postBlockUnblockDto = joi.object().keys({
  post_id: joi.string().required().label("Post id"),
});

const postDeleteDto = joi.object().keys({
  post_id: joi.string().required().label("Post id"),
});

const getCommentsdetailsDto = joi.object().keys({
  post_id: joi.string().required().label("Post id"),
  page: joi.string().allow().label("Page"),
  limit: joi.string().allow().label("Limit"),
});

const deleteCommentDto = joi.object().keys({
  comment_id: joi.string().required().label("Comment id"),
  is_sub_comment: joi.string().required().label("Is sub comment"),
});

const commentLikeDetailsDto = joi.object().keys({
  comment_id: joi.string().required().label("Comment id"),
});

const postViewDetailsDto = joi.object().keys({
  post_id: joi.string().required().label("Post id"),
});

const postLikeDetailsDto = joi.object().keys({
  post_id: joi.string().required().label("Post id"),
});

const postSaveDetailsDto = joi.object().keys({
  post_id: joi.string().required().label("Post id"),
});

const postReportDetailsDto = joi.object().keys({
  post_id: joi.string().required().label("Post id"),
});

const RepostDetailsDto = joi.object().keys({
  post_id: joi.string().required().label("Post id"),
});

const pollVotesDetailsDto = joi.object().keys({
  post_id: joi.string().required().label("Post id"),
});

const createFaqDto = joi.object().keys({
  question: joi.string().required().label("Question"),
  answer: joi.string().required().label("Answer"),
});

const editFaqDto = joi.object().keys({
  faq_id: joi.string().required().label("Faq id"),
  question: joi.string().allow().label("Question"),
  answer: joi.string().allow().label("Answer"),
});

const delete_faqDto = joi.object().keys({
  faq_id: joi.string().required().label("Faq id"),
});

module.exports = {
  adminSignUpInDto,
  sendOtpDto,
  verifyOtpDto,
  resetPasswordDto,
  changePasswordDto,
  changeVerificationStatusDto,
  addintrestDto,
  addsubintrestDto,
  editintrestDto,
  deleteintrestDto,
  editsubintrestDto,
  deletesubintrestDto,
  block_userDto,
  getUserdetailsDto,
  getPostdetailsDto,
  deleteUserDto,
  postBlockUnblockDto,
  postDeleteDto,
  getCommentsdetailsDto,
  deleteCommentDto,
  commentLikeDetailsDto,
  postViewDetailsDto,
  postLikeDetailsDto,
  postSaveDetailsDto,
  postReportDetailsDto,
  RepostDetailsDto,
  pollVotesDetailsDto,
  createFaqDto,
  editFaqDto,
  delete_faqDto,
};
