"use strict";

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Servidor de Arquivos Estáticos",
      version: "1.0.0",
      description: "API HTTP para utilização do Servidor de Arquivos Estáticos",
    },
  },
  apis: ["./src/**/*.js"],
};

module.exports = swaggerOptions;
