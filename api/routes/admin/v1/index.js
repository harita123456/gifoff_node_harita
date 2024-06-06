const router = require("express").Router();

const adminAuth = require("./R_admin");
const userDetails = require("./R_user_details");
const categories = require("./R_categories");
const clues = require("./R_clues");
const games = require("./R_games");
const quickchat = require("./R_quickchat");
const transaction = require("./R_transaction");

router.use("/api/v1/admin", adminAuth);
router.use("/api/v1/user_details", userDetails);
router.use("/api/v1/categories", categories);
router.use("/api/v1/clues", clues);
router.use("/api/v1/game", games);
router.use("/api/v1/quickchat", quickchat);
router.use("/api/v1/transaction", transaction);

module.exports = router;
