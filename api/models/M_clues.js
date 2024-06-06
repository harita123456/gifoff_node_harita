const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "categories",
      required: [true, "Category id is required."],
    },
    clue_name: {
      type: String,
      required: [true, "Clue is required."],
    },
    is_deleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("clues", categorySchema);
