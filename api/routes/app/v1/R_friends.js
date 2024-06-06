const router = require("express").Router();
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();

const userAuth = require("../../../middlewares/auth");

const {
  searchUserList,
  makeFriend,
  friendList,
  unFriend,
  sendfriendRequest,
  acceptDeclinefrinedRequest,
  cancelfriendRequest,
  requestsList,
} = require("../../../controller/app/v1/C_friends");

const validateRequest = require("../../../middlewares/validation");
const {
  searchUserListDto,
  makeFriendDto,
  unFriendDto,
  sendFriendrequestDto,
  accepteclineFriendreqDto,
  cancelfriendRequestDto,
  requestsListDto
} = require("../../../dto/app/v1/friends_dto");

router.post(
  "/search_user_list",
  multipartMiddleware,
  userAuth,
  validateRequest(searchUserListDto),
  searchUserList
);

router.post(
  "/make_friend",
  multipartMiddleware,
  userAuth,
  validateRequest(makeFriendDto),
  makeFriend
);

router.post(
  "/un_friend",
  multipartMiddleware,
  userAuth,
  validateRequest(unFriendDto),
  unFriend
);

router.post("/friend_list", multipartMiddleware, userAuth, friendList);
router.post("/send_friend_req", multipartMiddleware, userAuth, validateRequest(sendFriendrequestDto), sendfriendRequest);
router.post("/accept_decline_friendreq", multipartMiddleware, userAuth,validateRequest(accepteclineFriendreqDto), acceptDeclinefrinedRequest);
router.post("/cancel_friend_request", multipartMiddleware, userAuth,validateRequest(cancelfriendRequestDto), cancelfriendRequest);
router.post("/requests_list", multipartMiddleware, userAuth,validateRequest(requestsListDto), requestsList);

module.exports = router;
