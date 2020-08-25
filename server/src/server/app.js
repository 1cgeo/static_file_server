"use strict";

const express = require("express");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
const noCache = require("nocache");

const swaggerOptions = require("./swagger_options");
const swaggerSpec = swaggerJSDoc(swaggerOptions);

const { JWT_SECRET } = require("../config");

const {
  AppError,
  httpCode,
  logger,
  errorHandler,
  sendJsonAndLogMiddleware,
} = require("../utils");

const appRoutes = require("../routes");

const app = express();

// Add sendJsonAndLog to res object
app.use(sendJsonAndLogMiddleware);

app.use(bodyParser.json()); // parsear POST em JSON
app.use(hpp()); // protection against parameter polution

// CORS middleware
app.use(cors());

// Helmet Protection
app.use(helmet());
app.use(noCache());

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 200,
});

// apply limit all requests
app.use(limiter);

const argv = require("minimist")(process.argv.slice(2));
const secure = "https" in argv && argv.https;

app.use((req, res, next) => {
  const url = req.protocol + "://" + req.get("host") + req.originalUrl;

  logger.info(`${req.method} request`, {
    url,
    ip: req.ip,
  });
  return next();
});

app.use(
  session({
    name: "sid",
    saveUninitialized: false,
    resave: false,
    secret: JWT_SECRET,
    cookie: {
      maxAge: 1000 * 60 * 30,
      sameSite: true,
      secure: secure,
    },
  })
);

// All routes used by the App
app.use("/api", appRoutes);

// Serve SwaggerDoc
app.use("/api/api_docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve JSDocs
app.use("/api/js_docs", express.static(path.join(__dirname, "..", "js_docs")));

const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/");
  } else {
    next();
  }
};
// Serve React Files
app.use(express.static(path.join(__dirname, "..", "build")));

app.get("/static_files", redirectLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "static_files", "index.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "build", "index.html"));
});

app.use(
  redirectLogin,
  express.static(path.join(__dirname, "..", "static_files"))
);

app.use((req, res, next) => {
  const err = new AppError(
    `URL não encontrada para o método ${req.method}`,
    httpCode.NotFound
  );
  return next(err);
});

// Error handling
app.use((err, req, res, next) => {
  return errorHandler.log(err, res);
});

module.exports = app;
