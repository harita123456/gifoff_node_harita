const jwt = require("jsonwebtoken");
const users = require("../models/M_user");

const { errorRes, authFailRes } = require("../../utils/common_fun");

const verifyToken = async (req, res, next) => {
  try {
    const bearerHeader = req.headers["authorization"];

    if (!bearerHeader) {
      return errorRes(res, `A token is required for authentication.`);
    }

    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];

    const { id } = jwt.verify(bearerToken, process.env.TOKEN_KEY);
    // Find customer.
    const findUsers = await users.findById(id).where({
      is_deleted: false,
      is_block: false,
    });

    if (!findUsers) {
      return await authFailRes(res, "Authentication failed.");
    }
    req.user = findUsers;
    next();
  } catch (error) {
    // if (req.file) {
    //   let fileName = req.file.fieldname + "/" + req.file.filename;
    //   removeFile(fileName);
    // }

    if (error.message == "jwt malformed") {
      return await authFailRes(res, "Authentication failed.");
    }

    console.log("jwt::::::::::", error.message);
    return await errorRes(res, "Internal server error");
  }
};

module.exports = verifyToken;
