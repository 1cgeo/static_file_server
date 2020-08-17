"use strict";

const fs = require("fs");
const inquirer = require("inquirer");
const colors = require("colors"); // colors for console
colors.enable();

const path = require("path");
const axios = require("axios");
const crypto = require("crypto");

const pgtools = require("pgtools");
const promise = require("bluebird");
const pgp = require("pg-promise")({
  promiseLib: promise,
});

const readSqlFile = (file) => {
  const fullPath = path.join(__dirname, file);
  return new pgp.QueryFile(fullPath, { minify: true });
};

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

const getAuthUserData = async (servidor, token, uuid) => {
  const server = `${servidor}/api/usuarios/${uuid}`;

  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.get(server, config);

    if (
      !("status" in response) ||
      response.status !== 200 ||
      !("data" in response) ||
      !("dados" in response.data)
    ) {
      throw new Error();
    }
    return response.data.dados;
  } catch (e) {
    throw new Error("Erro ao se comunicar com o servidor de autenticação");
  }
};

const verifyLoginAuthServer = async (servidor, usuario, senha, aplicacao) => {
  const server = `${servidor}/api/login`;

  try {
    const response = await axios.post(server, {
      usuario,
      senha,
      aplicacao: aplicacao,
    });
    if (
      !response ||
      !("status" in response) ||
      response.status !== 201 ||
      !("data" in response) ||
      !("dados" in response.data) ||
      !("success" in response.data) ||
      !("token" in response.data.dados) ||
      !("uuid" in response.data.dados)
    ) {
      throw new Error("");
    }

    const authenticated = response.data.success || false;
    const authUserUUID = response.data.dados.uuid;
    const token = response.data.dados.token;

    const authUserData = await getAuthUserData(servidor, token, authUserUUID);
    return { authenticated, authUserData };
  } catch (e) {
    throw new Error("Erro ao se comunicar com o servidor de autenticação");
  }
};

const createDotEnv = (
  port,
  serviceName,
  serviceNameAbrev,
  authServer,
  dbServer,
  dbPort,
  dbName,
  dbUser,
  dbPassword
) => {
  const secret = crypto.randomBytes(64).toString("hex");

  const env = `PORT=${port}
DB_SERVER=${dbServer}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
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

const givePermission = async ({
  dbUser,
  dbPassword,
  dbPort,
  dbServer,
  dbName,
  connection,
}) => {
  if (!connection) {
    const connectionString = `postgres://${dbUser}:${dbPassword}@${dbServer}:${dbPort}/${dbName}`;

    connection = pgp(connectionString);
  }
  await connection.none(readSqlFile("./er/permissao.sql"), [dbUser]);
};

const insertAdminUser = async (authUserData, connection) => {
  const {
    login,
    nome,
    nome_guerra: nomeGuerra,
    tipo_posto_grad_id: tpgId,
    uuid,
  } = authUserData;

  await connection.none(
    `INSERT INTO dgeo.usuario (login, nome, nome_guerra, tipo_posto_grad_id, administrador, ativo, uuid) VALUES
    ($<login>, $<nome>, $<nomeGuerra>, $<tpgId>, TRUE, TRUE, $<uuid>)`,
    { login, nome, nomeGuerra, tpgId, uuid }
  );
};

const createDatabase = async (
  dbUser,
  dbPassword,
  dbPort,
  dbServer,
  dbName,
  authUserData
) => {
  const config = {
    user: dbUser,
    password: dbPassword,
    port: dbPort,
    host: dbServer,
  };

  await pgtools.createdb(config, dbName);

  const connectionString = `postgres://${dbUser}:${dbPassword}@${dbServer}:${dbPort}/${dbName}`;

  const db = pgp(connectionString);
  await db.tx(async (t) => {
    await t.none(readSqlFile("./er/versao.sql"));
    await t.none(readSqlFile("./er/dominio.sql"));
    await t.none(readSqlFile("./er/dgeo.sql"));
    await givePermission({ dbUser, connection: t });
    await insertAdminUser(authUserData, t);
  });
};

const handleError = (error) => {
  if (
    error.message ===
    "Postgres error. Cause: permission denied to create database"
  ) {
    console.log(
      "O usuário informado não é superusuário. Sem permissão para criar bancos de dados."
        .red
    );
  } else if (
    error.message === 'permission denied to create extension "postgis"'
  ) {
    console.log(
      "O usuário informado não é superusuário. Sem permissão para criar a extensão 'postgis'. Delete o banco de dados criado antes de executar a configuração novamente."
        .red
    );
  } else if (
    error.message.startsWith("Attempted to create a duplicate database")
  ) {
    console.log("O banco já existe.".red);
  } else if (
    error.message.startsWith("password authentication failed for user")
  ) {
    console.log("Senha inválida para o usuário".red);
  } else {
    console.log(error.message.red);
    console.log("-------------------------------------------------");
    console.log(error);
  }
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
        name: "dbServer",
        message:
          "Qual o endereço de IP do servidor do banco de dados PostgreSQL?",
      },
      {
        type: "input",
        name: "dbPort",
        message: "Qual a porta do servidor do banco de dados PostgreSQL?",
        default: 5432,
      },
      {
        type: "input",
        name: "dbUser",
        message:
          "Qual o nome do usuário do PostgreSQL para interação com o serviço (já existente no banco de dados e ser superusuario)?",
        default: "controle_app",
      },
      {
        type: "password",
        name: "dbPassword",
        mask: "*",
        message:
          "Qual a senha do usuário do PostgreSQL para interação com o serviço?",
      },
      {
        type: "input",
        name: "dbName",
        message: "Qual o nome do banco de dados do serviço?",
      },
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
        type: "confirm",
        name: "dbCreate",
        message: "Deseja criar o banco de dados do serviço?",
        default: true,
      },
      {
        type: "input",
        name: "authServerRaw",
        message:
          "Qual a URL do serviço de autenticação (iniciar com http:// ou https://)?",
      },
      {
        type: "input",
        name: "authUser",
        message:
          "Qual o nome do usuário já existente Serviço de Autenticação que será administrador do serviço?",
      },
      {
        type: "password",
        name: "authPassword",
        mask: "*",
        message:
          "Qual a senha do usuário já existente Serviço de Autenticação que será administrador do serviço?",
      },
    ];

    const {
      dbServer,
      dbPort,
      dbName,
      dbUser,
      dbPassword,
      dbCreate,
      port,
      serviceName,
      serviceNameAbrev,
      authServerRaw,
      authUser,
      authPassword,
    } = await inquirer.prompt(questions);

    const authServer = authServerRaw.endsWith("/")
      ? authServerRaw.slice(0, -1)
      : authServerRaw;

    await verifyAuthServer(authServer);

    const { authenticated, authUserData } = await verifyLoginAuthServer(
      authServer,
      authUser,
      authPassword,
      serviceNameAbrev
    );

    if (!authenticated) {
      throw new Error("Usuário ou senha inválida no Serviço de Autenticação.");
    }

    if (dbCreate) {
      await createDatabase(
        dbUser,
        dbPassword,
        dbPort,
        dbServer,
        dbName,
        authUserData
      );

      console.log(
        "Banco de dados criado com sucesso!".blue
      );
    } else {
      await givePermission({ dbUser, dbPassword, dbPort, dbServer, dbName });

      console.log(`Permissão ao usuário ${dbUser} adicionada com sucesso`.blue);
    }

    createDotEnv(
      port,
      serviceName,
      serviceNameAbrev,
      authServer,
      dbServer,
      dbPort,
      dbName,
      dbUser,
      dbPassword
    );

    console.log(
      "Arquivo de configuração (config.env) criado com sucesso!".blue
    );
  } catch (e) {
    handleError(e);
  }
};

createConfig();
