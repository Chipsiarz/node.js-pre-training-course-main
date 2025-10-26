// Express.js static files serving for ToDo frontend
const express = require("express");
const path = require("path");

const app = express();

app.use("/static", express.static(path.join(__dirname, "public")));

module.exports = app;
