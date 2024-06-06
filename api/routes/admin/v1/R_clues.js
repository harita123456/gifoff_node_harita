const router = require("express").Router();
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();

const userAuth = require("../../../middlewares/auth");
const validateRequest = require("../../../middlewares/validation");
const {
    addClues,
    editClues,
    getClues,
    listClues,
    deleteClues,
} = require("../../../controller/admin/v1/C_clues");

const {
    adminSignUpInDto,
} = require("../../../dto/admin/v1/admin_dto");

router.post(
    "/add_clue",
    multipartMiddleware,
    userAuth,
    addClues
);

router.post(
    "/edit_clue",
    multipartMiddleware,
    userAuth,
    editClues
);

router.post(
    "/get_clue",
    multipartMiddleware,
    userAuth,
    getClues
);

router.post(
    "/list_clue",
    multipartMiddleware,
    userAuth,
    listClues
);

router.post(
    "/delete_clue",
    multipartMiddleware,
    userAuth,
    deleteClues
);

module.exports = router;