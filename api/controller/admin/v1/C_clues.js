const {
    successRes,
    errorRes,
    multiSuccessRes,
} = require("../../../../utils/common_fun");
const categories = require("../../../models/M_categories");
const clues = require("../../../models/M_clues");

// const { dateTime } = require("../../../../utils/date_time");
// const { sendOtpCode } = require("../../../../utils/send_mail");
// const { userToken } = require("../../../../utils/token");

// const fs = require("fs");
// var nodemailer = require("nodemailer");
// const mongoose = require("mongoose");
// const moment = require("moment-timezone");
// const ObjectId = require("mongodb").ObjectId;

const addClues = async (req, res) => {
    try {
        let { category_id, clue_name } = req.body;

        let existingCategory = await categories.findOne({ _id: category_id, is_deleted: false });

        if (!existingCategory) {
            return errorRes(res, "Category not found");
        }

        let find_data = await clues.findOne({
            category_id: category_id,
            clue_name: clue_name,
            is_deleted: false,
        });

        if (find_data) {
            return errorRes(res, "This clue already exists");
        }

        let newClue = await clues.create({
            category_id: category_id,
            clue_name: clue_name,
        });
        return successRes(res, `Clue add successfully`, newClue);
    } catch (error) {
        console.log("Error : ", error);
        return errorRes(res, "Internal server error");
    }
};

const editClues = async (req, res) => {
    try {
        let { clue_id, category_id, clue_name } = req.body;

        let existingClue = await clues.findOne({ _id: clue_id, is_deleted: false });

        if (!existingClue) {
            return errorRes(res, "Clue not found");
        }

        let existingCategory = await categories.findOne({ _id: category_id, is_deleted: false });

        if (!existingCategory) {
            return errorRes(res, "Category not found");
        }

        existingClue.category_id = category_id;
        existingClue.clue_name = clue_name;

        let updatedClue = await existingClue.save();

        return successRes(res, "Clue updated successfully", updatedClue);
    } catch (error) {
        console.log("Error: ", error);
        return errorRes(res, "Internal server error");
    }
};

const getClues = async (req, res) => {
    try {
        let { clue_id } = req.body;
        const clue = await clues.findOne({ _id: clue_id, is_deleted: false }).populate('category_id');

        return successRes(res, "Clue get successfully", clue);
    } catch (error) {
        console.log("Error: ", error);
        return errorRes(res, "Internal server error");
    }
};

const listClues = async (req, res) => {
    try {

        let { category_id, page = 1, limit = 10, } = req.body;
        // var find_category = await categories
        //     .find()
        //     .where({ is_deleted: false })
        //     .select("category_name price is_premium")
        //     .sort({ createdAt: 1 });

        // var final_array = [];

        // for (var data of find_category) {
        //     var find_clues = await clues
        //         .find()
        //         .where({
        //             category_id: new ObjectId(data._id),
        //             is_deleted: false,
        //         })
        //         .select("clue_name")
        //         .sort({ createdAt: 1 });

        //     var value = {
        //         ...data._doc,
        //         clues_data: find_clues,
        //     };
        //     final_array.push(value);
        // }

        const clueList = await clues.find({ category_id: category_id, is_deleted: false })
            .limit(limit * 1)
            .skip((page - 1) * limit)
        // .populate('category_id');

        // return successRes(res, "Clues retrieved successfully", clueList);
        return multiSuccessRes(
            res,
            "Clues retrieved successfully",
            clueList,
            clueList.length
        );
    } catch (error) {
        console.log("Error: ", error);
        return errorRes(res, "Internal server error");
    }
};

const deleteClues = async (req, res) => {
    try {
        let { clue_id } = req.body;

        let existingClue = await clues.findOne({ _id: clue_id, is_deleted: false });

        if (!existingClue) {
            return errorRes(res, "Clue not found");
        }

        existingClue.is_deleted = true;

        const deletedClue = await existingClue.save();

        return successRes(res, "Clue deleted successfully",);
    } catch (error) {
        console.log("Error: ", error);
        return errorRes(res, "Internal server error");
    }
};

module.exports = {
    addClues,
    editClues,
    getClues,
    listClues,
    deleteClues,
};