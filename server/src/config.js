"use strict";

const dotenv = require("dotenv");
const Joi = require("joi");
const fs = require("fs");
const path = require("path");

const AppError = require("./utils/app_error");
const errorHandler = require("./utils/error_handler");

const configFile =
  process.env.NODE_ENV === "test" ? "config_testing.env" : "config.env";

const configPath = path.join(__dirname, "..", configFile);

if (!fs.existsSync(configPath)) {
  errorHandler.critical(
    new AppError(
      "Arquivo de configuração não encontrado. Configure o serviço primeiro."
    )
  );
}

dotenv.config({
  path: configPath,
});

const configSchema = Joi.object().keys({
  PORT: Joi.number().integer().required(),
  SERVICE_NAME: Joi.string().required(),
  SERVICE_NAME_ABREV: Joi.string().required(),
  AUTH_SERVER: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().required(),
});

const config = {
  PORT: process.env.PORT,
  SERVICE_NAME: process.env.SERVICE_NAME,
  SERVICE_NAME_ABREV: process.env.SERVICE_NAME_ABREV,
  AUTH_SERVER: process.env.AUTH_SERVER,
  JWT_SECRET: process.env.JWT_SECRET,
};

const { error } = configSchema.validate(config, {
  abortEarly: false,
});
if (error) {
  const { details } = error;
  const message = details.map((i) => i.message).join(",");

  errorHandler.critical(
    new AppError(
      "Arquivo de configuração inválido. Configure novamente o serviço.",
      null,
      message
    )
  );
}

module.exports = config;
