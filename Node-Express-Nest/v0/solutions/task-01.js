// Express.js app with GET /todos endpoint
const express = require("express");
const app = express();

const todos = [
  { id: 1, title: "Buy milk", completed: false },
  { id: 2, title: "Walk the dog", completed: true },
  { id: 3, title: "Finish homework", completed: false },
];

app.get("/todos", (req, res) => {
  res.json(todos);
});

module.exports = app;
