const bcrypt = require("bcrypt");
const crypto = require("crypto");

const algorithm = "aes-256-cbc";

// generate 16 bytes of random data
const initVector = "4185296385296371";
// const initVector = await crypto.randomBytes(16);

// secret key generate 32 bytes of random data
const securityKey = "37418529638529637418522222222222";
// const securityKey = await crypto.randomBytes(32);

// const securePassword = async (password) => {
//   const bcryptPassword = await bcrypt.hash(password, 12);
//   return bcryptPassword;
// };

// const comparePassword = async (password, dbPassword) => {
//   const passwordVerify = await bcrypt.compare(password, dbPassword);
//   return passwordVerify;
// };

const securePassword = async (password) => {
  const cipher = await crypto.createCipheriv(
    algorithm,
    securityKey,
    initVector
  );
  let encryptedData = await cipher.update(password, "utf-8", "hex");

  encryptedData += await cipher.final("hex");

  return encryptedData;
};

const comparePassword = async (password, dbPassword) => {
  let originalPwd = await decryptPassword(dbPassword);

  if (originalPwd == password) {
    return true;
  } else {
    return false;
  }
};

const decryptPassword = async (password) => {
  const decipher = crypto.createDecipheriv(algorithm, securityKey, initVector);
  let decryptedData = decipher.update(password, "hex", "utf-8");

  decryptedData += decipher.final("utf8");

  return decryptedData;
};

module.exports = { securePassword, comparePassword, decryptPassword };
