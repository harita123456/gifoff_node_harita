const router = require("express").Router();
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();

const userAuth = require("../../../middlewares/auth");
const validateRequest = require("../../../middlewares/validation");
const {
  gameDetailsDto,
  deleteGameDto,
  usergameListDto
} = require("../../../dto/admin/v1/game_dto");

const {
  gameList,
  getGamedetails,
  deleteGame,
  usergameList
} = require("../../../controller/admin/v1/C_game");

router.post("/game_list", multipartMiddleware, userAuth, gameList);

router.post(
  "/game_details",
  multipartMiddleware,
  userAuth,
  validateRequest(gameDetailsDto),
  getGamedetails
);

router.post(
  "/delete_game",
  multipartMiddleware,
  userAuth,
  validateRequest(deleteGameDto),
  deleteGame
);

router.post(
  "/user_game_list",
  multipartMiddleware,
  userAuth,
  validateRequest(usergameListDto),
  usergameList
);

module.exports = router;
