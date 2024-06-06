const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const categoryPurchaseSchema = new Schema(
  {
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "categories",
      required: [true, "Category id is required."],
    },
    purchase_id: {
      type: String,
      required: [true, "Category purchase id is required."],
    },
    amount: {
      type: Number,
      default: 0,
    },
    is_deleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("category_purchase", categoryPurchaseSchema);
