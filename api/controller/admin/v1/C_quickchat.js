const {
    successRes,
    errorRes,
    multiSuccessRes,
} = require("../../../../utils/common_fun");

const {
    notificationSend,
    notiSendMultipleDevice,
} = require("../../../../utils/notification_send");


const { dateTime } = require("../../../../utils/date_time");
const { userToken } = require("../../../../utils/token");
const quickChat = require("../../../models/M_quickchat");


const createQuickchat = async (req, res) => {
    try {
        let { chat_message } = req.body;

        let existingquickchat = await quickChat.findOne({ chat_message: chat_message, is_deleted: false });

        if (existingquickchat) {
            return errorRes(res, "Chat message already exists");
        }

        var find_quick = await quickChat.findOne({is_deleted:false}).sort({order:-1})
        let  newOrder = find_quick ? find_quick.order + 1 : 1;
        let newquickChat = await quickChat.create({
            chat_message: chat_message,
             order: newOrder,
        });
        return successRes(res, `Chat message add successfully`, newquickChat);
    } catch (error) {
        console.log("Error : ", error);
        return errorRes(res, "Internal server error");
    }
};

const editQuickchat = async (req, res) => {
    try {
        let { chat_id, chat_message } = req.body;

        let existingquickchat = await quickChat.findOne({ chat_message: chat_message, _id: { $ne: chat_id }, is_deleted: false });

        if (existingquickchat) {
            return errorRes(res, "Chat message already exists");
        }

        const update_quick_chat = await quickChat.findByIdAndUpdate(
            { _id: chat_id },
            {
                $set: {
                    chat_message: chat_message
                }
            },
            { new: true }
        );

        if (update_quick_chat) {
            return successRes(res, `Chat message Updated successfully`, update_quick_chat); 
        }

    } catch (error) {
        console.log("Error : ", error);
        return errorRes(res, "Internal server error");
    }
}

const deleteQuickchat = async (req, res) => {
    try {
        let { chat_id } = req.body;

        let existingquickchat = await quickChat.findOne({ _id: chat_id, is_deleted: false });

        if (!existingquickchat) {
            return errorRes(res, "Couldn't found chat id");
        }

        const delete_quick_chat = await quickChat.findByIdAndUpdate(
            { _id: chat_id },
            {
                $set: {
                    is_deleted: true
                }
            },
            { new: true }
        );

        if (delete_quick_chat) {
            return successRes(res, `Chat deleted successfully`, delete_quick_chat);
        }

    } catch (error) {
        console.log("Error : ", error);
        return errorRes(res, "Internal server error");
    }
}

const listQuickchat = async (req, res) => {
    try {
        const quick_chat_list = await quickChat.find({ is_deleted: false }).sort({order:1})
        if (quick_chat_list) {
            return successRes(res, `Chat message List getc successfully`, quick_chat_list);
        }
    } catch (error) {
        console.log("Error : ", error);
        return errorRes(res, "Internal server error");
    }
}

module.exports = {
    createQuickchat,
    editQuickchat,
    deleteQuickchat,
    listQuickchat,
};