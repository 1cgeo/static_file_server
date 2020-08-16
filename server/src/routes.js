"use strict";
const express = require("express");
const { SERVICE_NAME, SERVICE_NAME_ABREV } = require("./config");

const { httpCode } = require("./utils");

const { loginRoute } = require("./login");

const router = express.Router();

router.get("/", (req, res, next) => {
  return res.sendJsonAndLog(
    true,
    "Servidor de Arquivos Estáticos operacional",
    httpCode.OK,
    {
      service_name: SERVICE_NAME,
      service_name_abrev: SERVICE_NAME_ABREV,
    }
  );
});

router.use("/login", loginRoute);

module.exports = router;
