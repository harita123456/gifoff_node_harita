const router = require("express").Router();
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();
const userAuth = require("../../../middlewares/auth");
const {
  userList,
  getUserdetails,
  blockUser,
  deleteUser,
  friendsList
} = require("../../../controller/admin/v1/C_user_details");

router.post("/user_list", multipartMiddleware, userAuth, userList);

router.post("/user_details", multipartMiddleware, userAuth, getUserdetails);

router.post("/block_user", multipartMiddleware, userAuth, blockUser);

router.post("/delete_user", multipartMiddleware, userAuth, deleteUser);
router.post("/friends_list", multipartMiddleware, userAuth, friendsList);

module.exports = router;
