const router = require("express").Router();
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();
const userAuth = require("../../../middlewares/auth");

const {
    createQuickchat,
    editQuickchat,
    deleteQuickchat,
    listQuickchat,
} = require("../../../controller/admin/v1/C_quickchat");
const validateRequest = require("../../../middlewares/validation");
const { createQuickchatDto,
    editQuickchatDto,
    deleteQuickchatDto } = require("../../../dto/admin/v1/quickchat_dto");

router.post(
    "/create_quick_chat",
    multipartMiddleware,
    userAuth,
    validateRequest(createQuickchatDto),
    createQuickchat
);

router.post(
    "/edit_quick_chat",
    multipartMiddleware,
    userAuth,
    validateRequest(editQuickchatDto),
    editQuickchat
);

router.post(
    "/delete_quick_chat",
    multipartMiddleware,
    userAuth,
    validateRequest(deleteQuickchatDto),
    deleteQuickchat
);

router.post(
    "/list_quick_chat",
    multipartMiddleware,
    userAuth,
    // validateRequest(usergameListDto),
    listQuickchat
);

module.exports = router;