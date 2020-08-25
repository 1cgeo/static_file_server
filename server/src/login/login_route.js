"use strict";

const express = require("express");

const { schemaValidation, asyncHandler, httpCode } = require("../utils");

const loginCtrl = require("./login_ctrl");
const loginSchema = require("./login_schema");

const router = express.Router();

router.get(
  "/test_session",
  asyncHandler(async (req, res, next) => {
    const logged = req.session.userId ? true : false;
    const msg = "Situação da seção retornada com sucesso";

    return res.sendJsonAndLog(true, msg, httpCode.OK, logged);
  })
);

router.post(
  "/end_session",
  asyncHandler(async (req, res, next) => {
    req.session.destroy((err) => {
      if (err) {
        throw err;
      }
    });
    const msg = "Logout executado com sucesso";

    return res.sendJsonAndLog(true, msg, httpCode.Created);
  })
);

router.post(
  "/",
  schemaValidation({ body: loginSchema.login }),
  asyncHandler(async (req, res, next) => {
    const dados = await loginCtrl.login(
      req.body.usuario,
      req.body.senha,
      req.body.aplicacao
    );
    req.session.userId = dados.uuid;

    return res.sendJsonAndLog(
      true,
      "Usuário autenticado com sucesso",
      httpCode.Created,
      dados
    );
  })
);

module.exports = router;
