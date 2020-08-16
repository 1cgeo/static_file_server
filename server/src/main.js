"use strict";

const { errorHandler } = require("./utils");
const { startServer } = require("./server");
const { verifyAuthServer } = require("./authentication");

verifyAuthServer().then(startServer).catch(errorHandler.critical);
