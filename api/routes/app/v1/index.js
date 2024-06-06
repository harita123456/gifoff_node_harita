const router = require("express").Router();

const app_version = require("./R_app_version");
const user = require("./R_user");
const friends = require("./R_friends");
const payment_history = require("./R_payment_history");


router.use("/api/v1/app_version", app_version);
router.use("/api/v1/user", user);
router.use("/api/v1/friends", friends);
router.use("/api/v1/payment_history", payment_history);


module.exports = router;
