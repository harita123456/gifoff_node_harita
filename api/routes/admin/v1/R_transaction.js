const router = require("express").Router();
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();

const userAuth = require("../../../middlewares/auth");
// const validateRequest = require("../../../middlewares/validation");
const {
  transactionList,
} = require("../../../controller/admin/v1/C_transaction");

router.post(
  "/transaction_list",
  multipartMiddleware,
  userAuth,
  transactionList
);

module.exports = router;
