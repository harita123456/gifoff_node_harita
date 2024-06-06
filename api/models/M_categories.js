const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    category_name: {
      type: String,
      required: [true, "Category name is required."],
    },
    description: {
      type: String,
      required: [true, "Category description is required."],
    },
    category_image: {
      type: String,
      required: [true, "Category image is required."],
    },
    price: {
      type: Number,
      default: 0,
    },
    is_premium: {
      type: Boolean,
      required: true,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("categories", categorySchema);
