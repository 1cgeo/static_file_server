"use strict";
const express = require("express");
const { SERVICE_NAME, SERVICE_NAME_ABREV } = require("./config");
const { databaseVersion } = require("./database");

const { httpCode } = require("./utils");

const { loginRoute } = require("./login");
const { usuarioRoute } = require("./usuario");

const router = express.Router();

router.get("/", (req, res, next) => {
  return res.sendJsonAndLog(
    true,
    "Servidor de Arquivos Estáticos operacional",
    httpCode.OK,
    {
      service_name: SERVICE_NAME,
      service_name_abrev: SERVICE_NAME_ABREV,
      database_version: databaseVersion.nome,
    }
  );
});

router.use("/login", loginRoute);
router.use("/usuarios", usuarioRoute);

module.exports = router;
