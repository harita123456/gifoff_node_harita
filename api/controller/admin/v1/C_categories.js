const {
  successRes,
  errorRes,
  multiSuccessRes,
} = require("../../../../utils/common_fun");
const categories = require("../../../models/M_categories");
const clues = require("../../../models/M_clues");

const {
  securePassword,
  comparePassword,
} = require("../../../../utils/secure_pwd");

const {
  notificationSend,
  notiSendMultipleDevice,
} = require("../../../../utils/notification_send");

const { dateTime } = require("../../../../utils/date_time");
const { sendOtpCode } = require("../../../../utils/send_mail");
const { userToken } = require("../../../../utils/token");

const fs = require("fs");
const path = require("path");
const outputPath = path.join(__dirname, "../../../../");
var nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const ObjectId = require("mongodb").ObjectId;

const addCategories = async (req, res) => {
  try {
    let { category_name, price, is_premium, description } = req.body;

    var { category_image } = req.files;

    let find_data = await categories.findOne({
      category_name: category_name,
      is_deleted: false,
    });

    if (find_data) {
      return errorRes(res, "This category already exists");
    }

    let insertdata = {
      category_name: category_name,
      description: description,
      price: price,
      is_premium: is_premium,
    };

    if (category_image) {
      let file_extension = category_image.originalFilename
        .split(".")
        .pop()
        .toLowerCase();

      var file_name =
        Math.floor(1000 + Math.random() * 9000) +
        "_" +
        Date.now() +
        "." +
        file_extension;

      // Upload file into folder
      let oldPath = category_image.path;
      let newPath = "public/category_image/" + file_name;

      await fs.readFile(oldPath, function (err, data) {
        if (err) throw err;

        fs.writeFile(newPath, data, function (err) {
          if (err) throw err;
        });
      });

      insertdata = {
        ...insertdata,
        category_image: "category_image/" + file_name,
      };
    }

    let add_categories = await categories.create(insertdata);

    if (add_categories?.category_image) {
      add_categories.category_image =
        process.env.BASE_URL + add_categories.category_image;
    }

    return successRes(res, `Category add successfully`, add_categories);
  } catch (error) {
    console.log("Error : ", error);
    return errorRes(res, "Internal server error");
  }
};

const editCategories = async (req, res) => {
  try {
    let { category_id, category_name, price, is_premium, description } =
      req.body;

    var { category_image } = req.files;

    let existingCategory = await categories.findOne({
      _id: category_id,
      is_deleted: false,
    });

    if (!existingCategory) {
      return errorRes(res, "Category not found");
    }

    if (category_image) {
      let file_extension = category_image.originalFilename
        .split(".")
        .pop()
        .toLowerCase();

      var file_name =
        Math.floor(1000 + Math.random() * 9000) +
        "_" +
        Date.now() +
        "." +
        file_extension;

      // Upload file into folder
      let oldPath = category_image.path;
      let newPath = "public/category_image/" + file_name;

      await fs.readFile(oldPath, function (err, data) {
        if (err) throw err;

        fs.writeFile(newPath, data, function (err) {
          if (err) throw err;
        });
      });

      await fs.unlink(
        `${outputPath}/public/${existingCategory.category_image}`,
        (err) => {
          // if (err) throw err;
          if (err) console.log(err);
        }
      );

      existingCategory.category_image = "category_image/" + file_name;
    }

    existingCategory.category_name = category_name;
    existingCategory.price = price;
    existingCategory.is_premium = is_premium;
    existingCategory.description = description;

    let updatedCategory = await existingCategory.save();

    if (updatedCategory?.category_image) {
      updatedCategory.category_image =
        process.env.BASE_URL + updatedCategory.category_image;
    }

    return successRes(res, "Category updated successfully", updatedCategory);
  } catch (error) {
    console.log("Error: ", error);
    return errorRes(res, "Internal server error");
  }
};

const getCategories = async (req, res) => {
  try {
    let { category_id } = req.body;
    const category = await categories.findOne({
      _id: category_id,
      is_deleted: false,
    });

    if (category?.category_image) {
      category.category_image = process.env.BASE_URL + category.category_image;
    }

    return successRes(res, "Category get successfully", category);
  } catch (error) {
    console.log("Error: ", error);
    return errorRes(res, "Internal server error");
  }
};

const listCategories = async (req, res) => {
  try {
    const categoriesList = await categories.find({ is_deleted: false });
    // .sort({ createdAt: -1 });

    categoriesList?.forEach((category) => {
      if (category?.category_image) {
        category.category_image =
          process.env.BASE_URL + category.category_image;
      }
    });

    return successRes(res, "Categories retrieved successfully", categoriesList);
  } catch (error) {
    console.log("Error: ", error);
    return errorRes(res, "Internal server error");
  }
};

const deleteCategories = async (req, res) => {
  try {
    let { category_id } = req.body;

    let existingCategory = await categories.findOne({
      _id: category_id,
      is_deleted: false,
    });

    if (!existingCategory) {
      return errorRes(res, "Category not found");
    }

    existingCategory.is_deleted = true;

    const deletedCategory = await existingCategory.save();

    return successRes(res, "Category deleted successfully");
  } catch (error) {
    console.log("Error: ", error);
    return errorRes(res, "Internal server error");
  }
};

module.exports = {
  addCategories,
  editCategories,
  getCategories,
  listCategories,
  deleteCategories,
};
