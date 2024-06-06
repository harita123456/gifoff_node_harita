const router = require("express").Router();
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();

const userAuth = require("../../../middlewares/auth");

const {
  addMembership,
  checkMembership,
  cancelMebership,
  updateMembership,
  removeMebership,
} = require("../../../controller/app/v1/C_payment_history");

const validateRequest = require("../../../middlewares/validation");

const {
  addMembershipDto,
  checkMembershipDto,
  cancelMebershipDto,
  updateMebershipDto,
  removeMebershipDto,
} = require("../../../dto/app/v1/payment_history_dto");

router.post(
  "/add_membership",
  multipartMiddleware,
  userAuth,
  validateRequest(addMembershipDto),
  addMembership
);

router.post(
  "/check_membership",
  multipartMiddleware,
  userAuth,
  validateRequest(checkMembershipDto),
  checkMembership
);

router.post(
  "/cancel_membership",
  multipartMiddleware,
  userAuth,
  validateRequest(cancelMebershipDto),
  cancelMebership
);

router.post(
  "/remove_membership",
  multipartMiddleware,
  userAuth,
  validateRequest(removeMebershipDto),
  removeMebership
);

router.post(
  "/update_membership",
  multipartMiddleware,
  userAuth,
  validateRequest(updateMebershipDto),
  updateMembership
);

module.exports = router;
