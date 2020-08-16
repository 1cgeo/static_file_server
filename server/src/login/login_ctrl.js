"use strict";

const jwt = require("jsonwebtoken");

const { AppError, httpCode } = require("../utils");

const { JWT_SECRET } = require("../config");

const { authenticateUser } = require("../authentication");

const controller = {};

const signJWT = (data, secret) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      data,
      secret,
      {
        expiresIn: "1h",
      },
      (err, token) => {
        if (err) {
          reject(new AppError("Erro durante a assinatura do token", null, err));
        }
        resolve(token);
      }
    );
  });
};

controller.login = async (login, senha, aplicacao) => {
  const verifyAuthentication = await authenticateUser(login, senha, aplicacao);
  if (!verifyAuthentication) {
    throw new AppError("Usuário ou senha inválida", httpCode.BadRequest);
  }

  const token = await signJWT({ login }, JWT_SECRET);

  return { token, login };
};

module.exports = controller;
