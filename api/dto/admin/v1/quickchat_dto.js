const joi = require("joi");
joi.objectId = require("joi-objectid")(joi);


const createQuickchatDto = joi.object().keys({
    chat_message: joi.string().required().label("Chat message"),
});

const editQuickchatDto = joi.object().keys({
    chat_id: joi.string().required().label("chat_id"),
    chat_message: joi.string().required().label("Chat message"),
});

const deleteQuickchatDto = joi.object().keys({
    chat_id: joi.string().required().label("chat_id"),
});

module.exports = {
    createQuickchatDto,
    editQuickchatDto,
    deleteQuickchatDto,
};
