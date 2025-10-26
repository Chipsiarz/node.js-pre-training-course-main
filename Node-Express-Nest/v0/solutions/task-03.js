// Express.js logging middleware for ToDo API
function loggingMiddleware(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next();
}

module.exports = loggingMiddleware;
