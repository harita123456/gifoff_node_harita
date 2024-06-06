const joi = require("joi");
joi.objectId = require("joi-objectid")(joi);

const gameDetailsDto = joi.object().keys({
  game_id: joi.string().required().label("Game id"),
});

const deleteGameDto = joi.object().keys({
  game_id: joi.string().required().label("Game id"),
});


const usergameListDto = joi.object().keys({
  user_id: joi.string().required().label("User id"),
  // game_type: joi.string().required().valid("public","private"),
});

module.exports = {
  gameDetailsDto,
  deleteGameDto,
  usergameListDto
};
