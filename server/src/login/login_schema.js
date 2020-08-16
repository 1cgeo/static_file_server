"use strict";

const Joi = require("joi");
const { SERVICE_NAME_ABREV } = require("../config");

const models = {};

models.login = Joi.object().keys({
  usuario: Joi.string().required(),
  senha: Joi.string().required(),
  aplicacao: Joi.string().required().valid(SERVICE_NAME_ABREV),
});

module.exports = models;
