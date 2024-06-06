const router = require("express").Router();
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();
const userAuth = require("../../../middlewares/auth");
const validateRequest = require("../../../middlewares/validation");
const {
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
} = require("../../../controller/app/v1/C_user");

const { searchUserList } = require("../../../controller/app/v1/C_friends");

const {
  userSignUpDto,
  userSigninDto,
  sendotpdto,
  verifyOtpDto,
  resetPasswordDto,
  checkmailDto,
  changePasswordDto,
  editProfileDto,
  createSupportDto,
} = require("../../../dto/app/v1/user_dto");

router.post(
  "/search_user_list",
  multipartMiddleware,
  userAuth,
  // validateRequest(addAppVersionDto),
  searchUserList
);

// validateRequest(createEventDto)
router.post(
  "/sign_up",
  multipartMiddleware,
  validateRequest(userSignUpDto),
  signup
);
router.post(
  "/sign_in",
  multipartMiddleware,
  validateRequest(userSigninDto),
  signIn
);
router.post(
  "/send_otp",
  multipartMiddleware,
  validateRequest(sendotpdto),
  sendOTP
);
router.post(
  "/verify_otp",
  multipartMiddleware,
  validateRequest(verifyOtpDto),
  verifyOtp
);
router.post(
  "/reset_password",
  multipartMiddleware,
  validateRequest(resetPasswordDto),
  resetPassword
);
router.post(
  "/check_mail",
  multipartMiddleware,
  validateRequest(checkmailDto),
  checkEmail
);

router.post(
  "/change_password",
  multipartMiddleware,
  userAuth,
  validateRequest(changePasswordDto),
  changePassword
);

router.post("/delete_account", multipartMiddleware, userAuth, deleteAccount);

router.post("/logout", multipartMiddleware, userAuth, logout);

router.post("/get_profile", multipartMiddleware, userAuth, getProfile);

router.post(
  "/edit_profile",
  multipartMiddleware,
  userAuth,
  validateRequest(editProfileDto),
  editProfile
);

router.post("/category_list", multipartMiddleware, userAuth, categoryList);

router.post("/clue_list", multipartMiddleware, userAuth, clueList);

router.post("/upload_gif", multipartMiddleware, userAuth, uploadGIF);

router.post(
  "/contact_support",
  multipartMiddleware,
  userAuth,
  validateRequest(createSupportDto),
  contactSupport
);

router.post("/privacy_policy", multipartMiddleware, userAuth, privacyPolicy);

router.post(
  "/check_match_player",
  multipartMiddleware,
  userAuth,
  checkMatchPlayers
);

module.exports = router;
