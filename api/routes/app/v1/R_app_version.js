const router = require("express").Router();
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();

const {
  addAppVersion,
  appVersionCheck,
} = require("../../../controller/app/v1/C_app_version");
const validateRequest = require("../../../middlewares/validation");

const {
  addAppVersionDto,
  appVersionCheckDto,
} = require("../../../dto/app/v1/app_version_dto");

router.post(
  "/add_app_version",
  multipartMiddleware,
  validateRequest(addAppVersionDto),
  addAppVersion
);

router.post(
  "/check_app_version",
  multipartMiddleware,
  validateRequest(appVersionCheckDto),
  appVersionCheck
);

module.exports = router;
