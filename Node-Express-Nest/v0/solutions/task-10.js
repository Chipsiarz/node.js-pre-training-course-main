// Express.js GET /todos/search endpoint with query params
const express = require("express");
const app = express();

let todos = [
  { id: 1, title: "Buy milk", completed: false },
  { id: 2, title: "Walk the dog", completed: true },
  { id: 3, title: "Finish homework", completed: false },
];

app.get("/todos/search", (req, res) => {
  const { completed } = req.query;

  let filtered = todos;

  if (completed !== undefined) {
    const isCompleted = completed === "true";
    filtered = todos.filter((t) => t.completed === isCompleted);
  }

  res.json(filtered);
});

module.exports = app;
