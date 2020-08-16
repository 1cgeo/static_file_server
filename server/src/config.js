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

const VERSION = "1.0.0";
const MIN_DATABASE_VERSION = "1.0.0";

const configSchema = Joi.object().keys({
  PORT: Joi.number().integer().required(),
  SERVICE_NAME: Joi.string().required(),
  SERVICE_NAME_ABREV: Joi.string().required(),
  AUTH_SERVER: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().required(),
  DB_SERVER: Joi.string().required(),
  DB_PORT: Joi.number().integer().required(),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  VERSION: Joi.string().required(),
  MIN_DATABASE_VERSION: Joi.string().required(),
});

const config = {
  PORT: process.env.PORT,
  SERVICE_NAME: process.env.SERVICE_NAME,
  SERVICE_NAME_ABREV: process.env.SERVICE_NAME_ABREV,
  AUTH_SERVER: process.env.AUTH_SERVER,
  JWT_SECRET: process.env.JWT_SECRET,
  DB_SERVER: process.env.DB_SERVER,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  VERSION,
  MIN_DATABASE_VERSION,
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
