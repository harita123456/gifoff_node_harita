const router = require("express").Router();
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();

const userAuth = require("../../../middlewares/auth");
// const validateRequest = require("../../../middlewares/validation");
const {
    addCategories,
    editCategories,
    getCategories,
    listCategories,
    deleteCategories,
} = require("../../../controller/admin/v1/C_categories");

const {
    // adminSignUpInDto,
} = require("../../../dto/admin/v1/admin_dto");

router.post(
    "/add_category",
    multipartMiddleware,
    userAuth,
    addCategories
);

router.post(
    "/edit_category",
    multipartMiddleware,
    userAuth,
    editCategories
);

router.post(
    "/get_category",
    multipartMiddleware,
    userAuth,
    getCategories
);

router.post(
    "/list_category",
    multipartMiddleware,
    userAuth,
    listCategories
);

router.post(
    "/delete_category",
    multipartMiddleware,
    userAuth,
    deleteCategories
);

module.exports = router;