"use strict";

const fs = require("fs");
const inquirer = require("inquirer");
const colors = require("colors"); // colors for console
colors.enable();

const path = require("path");
const axios = require("axios");
const crypto = require("crypto");

const verifyDotEnv = () => {
  return fs.existsSync(path.join(__dirname, "server", "config.env"));
};

const verifyDotEnvClient = () => {
  return fs.existsSync(path.join(__dirname, "client", ".env"));
};

const verifyAuthServer = async (authServer) => {
  if (!authServer.startsWith("http://") && !authServer.startsWith("https://")) {
    throw new Error("Servidor deve iniciar com http:// ou https://");
  }
  try {
    const response = await axios.get(`${authServer}/api`);
    const wrongServer =
      !response ||
      response.status !== 200 ||
      !("data" in response) ||
      response.data.message !== "Serviço de autenticação operacional";

    if (wrongServer) {
      throw new Error();
    }
  } catch (e) {
    throw new Error("Erro ao se comunicar com o servidor de autenticação");
  }
};

const createDotEnv = (port, serviceName, serviceNameAbrev, authServer) => {
  const secret = crypto.randomBytes(64).toString("hex");

  const env = `PORT=${port}
SERVICE_NAME=${serviceName}
SERVICE_NAME_ABREV=${serviceNameAbrev}
AUTH_SERVER=${authServer}
JWT_SECRET=${secret}`;

  fs.writeFileSync(path.join(__dirname, "server", "config.env"), env);

  const env_client = `INLINE_RUNTIME_CHUNK=false
REACT_APP_SERVICE_NAME=${serviceName}
REACT_APP_SERVICE_NAME_ABREV=${serviceNameAbrev}`;

  fs.writeFileSync(path.join(__dirname, "client", ".env"), env_client);
};

const handleError = (error) => {
  console.log(error.message.red);
  console.log("-------------------------------------------------");
  console.log(error);
  process.exit(0);
};

const createConfig = async () => {
  try {
    console.log("Servidor de Arquivos Estáticos API Rest".blue);
    console.log("Criação do arquivo de configuração".blue);

    const exists = verifyDotEnv();
    if (exists) {
      throw new Error(
        "Arquivo config.env já existe na pasta server, apague antes de iniciar a configuração."
      );
    }
    const existsClient = verifyDotEnvClient();
    if (existsClient) {
      throw new Error(
        "Arquivo .env já existe na pasta client, apague antes de iniciar a configuração."
      );
    }

    const questions = [
      {
        type: "input",
        name: "serviceName",
        message:
          "Qual o nome do serviço a ser criado (deve estar cadastrado no serviço de autenticação)?",
      },
      {
        type: "input",
        name: "serviceNameAbrev",
        message: "Informe uma versão abreviada do nome (sem espaços)",
      },
      {
        type: "input",
        name: "port",
        message: "Qual a porta do serviço do Servidor de Arquivos Estáticos",
        default: 3051,
      },
      {
        type: "input",
        name: "authServerRaw",
        message:
          "Qual a URL do serviço de autenticação (iniciar com http:// ou https://)?",
      },
    ];

    const {
      port,
      serviceName,
      serviceNameAbrev,
      authServerRaw,
    } = await inquirer.prompt(questions);

    const authServer = authServerRaw.endsWith("/")
      ? authServerRaw.slice(0, -1)
      : authServerRaw;

    await verifyAuthServer(authServer);

    createDotEnv(port, serviceName, serviceNameAbrev, authServer);

    console.log(
      "Arquivo de configuração (config.env) criado com sucesso!".blue
    );
  } catch (e) {
    handleError(e);
  }
};

createConfig();
