const router = require("express").Router();
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();

const userAuth = require("../../../middlewares/auth");
const validateRequest = require("../../../middlewares/validation");
const {
  adminSignUp,
  adminLogin,
  sendOTP,
  verifyOtp,
  resetPassword,
  changePassword,
  logout,
  dashboard,
} = require("../../../controller/admin/v1/C_admin");

const {
  adminSignUpInDto,
  sendOtpDto,
  verifyOtpDto,
  resetPasswordDto,
  changePasswordDto,
} = require("../../../dto/admin/v1/admin_dto");

router.post(
  "/admin_signUp",
  multipartMiddleware,
  validateRequest(adminSignUpInDto),
  adminSignUp
);
router.post(
  "/admin_login",
  multipartMiddleware,
  validateRequest(adminSignUpInDto),
  adminLogin
);
router.post(
  "/send_otp",
  multipartMiddleware,
  validateRequest(sendOtpDto),
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
  "/change_password",
  multipartMiddleware,
  userAuth,
  validateRequest(changePasswordDto),
  changePassword
);
router.post("/logout", multipartMiddleware, userAuth, logout);
router.post("/dashboard", multipartMiddleware, userAuth, dashboard);

module.exports = router;
