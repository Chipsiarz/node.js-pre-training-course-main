const http = require("http");
const url = require("url");

/**
 * Todo REST API Server
 * Built with Node.js built-in HTTP module
 * Supports full CRUD operations with in-memory storage
 */

/**
 * Parse JSON request body from HTTP request
 * @param {IncomingMessage} req - HTTP request object
 * @returns {Promise<Object>} Parsed JSON data
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const contentType = (req.headers["content-type"] || "")
      .split(";")[0]
      .trim();
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      if (contentType && contentType !== "application/json") {
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", (err) => reject(err));
  });
}

/**
 * Extract path parameters from URL pattern
 * @param {string} pattern - URL pattern like '/todos/:id'
 * @param {string} path - Actual path like '/todos/123'
 * @returns {Object} Extracted parameters like { id: "123" }
 */
function parsePathParams(pattern, path) {
  const patParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patParts.length; i++) {
    const pp = patParts[i];
    const ap = pathParts[i];
    if (pp.startsWith(":")) {
      params[pp.slice(1)] = ap;
    } else {
      if (pp !== ap) return null;
    }
  }
  return params;
}

/**
 * Send consistent JSON response
 * @param {ServerResponse} res - HTTP response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 */
function sendResponse(res, statusCode, payload) {
  const json = JSON.stringify(payload || {});
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(json);
}

/**
 * Validate todo data according to business rules
 * @param {Object} todoData - Todo data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} Validation result with errors array
 */
function validateTodo(todoData, isUpdate = false) {
  const errors = [];
  if (!isUpdate || "title" in todoData) {
    if (
      !("title" in todoData) ||
      todoData.title === undefined ||
      todoData.title === null
    ) {
      if (!isUpdate) errors.push("Title is required");
    } else {
      if (typeof todoData.title !== "string") {
        errors.push("Title must be a string");
      } else {
        const trimmed = todoData.title.trim();
        if (trimmed.length < 1 || trimmed.length > 100) {
          errors.push("Title must be 1-100 characters and not only whitespace");
        }
      }
    }
  }

  if ("description" in todoData && todoData.description != null) {
    if (typeof todoData.description !== "string") {
      errors.push("Description must be a string");
    } else if (todoData.description.length > 500) {
      errors.push("Description must be at most 500 characters");
    }
  }

  if ("completed" in todoData && todoData.completed != null) {
    if (typeof todoData.completed !== "boolean") {
      errors.push("Completed must be a boolean");
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * TodoServer Class - Main HTTP server for Todo API
 */
class TodoServer {
  constructor(port = 3000) {
    this.port = port;
    this.todos = [];
    this.nextId = 1;
    this.initializeSampleData();
    this.handleRequest = this.handleRequest.bind(this);
  }

  /**
   * Initialize server with sample todo data
   */
  initializeSampleData() {
    const now = new Date().toISOString();
    this.todos = [
      {
        id: this.generateNextId(),
        title: "Buy milk",
        description: "Get 2 liters of milk",
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: this.generateNextId(),
        title: "Read book",
        description: "Read 20 pages",
        completed: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  /**
   * Start the HTTP server
   */
  start() {
    this.server = http.createServer(this.handleRequest);
    this.server.on("error", (err) => {
      console.error("Server error:", err);
    });
    this.server.listen(this.port, () => {
      console.log("=== Todo Server Started ===");
      console.log(`Server running on http://localhost:${this.port}`);
    });
  }

  /**
   * Main request handler - routes requests to appropriate methods
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   */
  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname || "/";
    const method = (req.method || "GET").toUpperCase();

    // Simple request logging
    console.log(`${method} ${pathname}`);

    // handle OPTIONS
    if (method === "OPTIONS") {
      // respond with CORS headers
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }

    try {
      // Routing
      if (method === "GET" && pathname === "/todos") {
        return this.getAllTodos(req, res, parsedUrl.query);
      }

      // GET /todos/:id
      const getByIdParams = parsePathParams("/todos/:id", pathname);
      if (method === "GET" && getByIdParams) {
        return this.getTodoById(req, res, getByIdParams);
      }

      // POST /todos
      if (method === "POST" && pathname === "/todos") {
        return this.createTodo(req, res);
      }

      // PUT /todos/:id
      const putParams = parsePathParams("/todos/:id", pathname);
      if (method === "PUT" && putParams) {
        return this.updateTodo(req, res, putParams);
      }

      // DELETE /todos/:id
      const delParams = parsePathParams("/todos/:id", pathname);
      if (method === "DELETE" && delParams) {
        return this.deleteTodo(req, res, delParams);
      }

      // Method not allowed for known base
      if (pathname.startsWith("/todos")) {
        return sendResponse(res, 405, {
          success: false,
          error: "Method not allowed",
        });
      }

      // Unknown route
      return sendResponse(res, 404, { success: false, error: "Not Found" });
    } catch (err) {
      console.error("Request handling error:", err);
      return sendResponse(res, 500, {
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Handle GET /todos - Get all todos with optional filtering
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   * @param {Object} query - URL query parameters
   */
  async getAllTodos(req, res, query) {
    let results = [...this.todos];
    if (query && "completed" in query) {
      const q = String(query.completed).toLowerCase();
      if (q === "true" || q === "false") {
        const flag = q === "true";
        results = results.filter((t) => Boolean(t.completed) === flag);
      } else {
        return sendResponse(res, 400, {
          success: false,
          error: "Invalid completed query parameter",
        });
      }
    }
    return sendResponse(res, 200, {
      success: true,
      data: results,
      count: results.length,
    });
  }

  /**
   * Handle GET /todos/:id - Get specific todo by ID
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   * @param {Object} params - Path parameters
   */
  async getTodoById(req, res, params) {
    const id = params.id;
    const todo = this.findTodoById(id);
    if (!todo)
      return sendResponse(res, 404, {
        success: false,
        error: "Todo not found",
      });
    return sendResponse(res, 200, { success: true, data: todo });
  }

  /**
   * Handle POST /todos - Create new todo
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   */
  async createTodo(req, res) {
    try {
      const body = await parseBody(req);
      const { isValid, errors } = validateTodo(body, false);
      if (!isValid) {
        return sendResponse(res, 400, {
          success: false,
          error: errors.join("; "),
        });
      }
      const now = new Date().toISOString();
      const newTodo = {
        id: this.generateNextId(),
        title: body.title.trim(),
        description:
          typeof body.description === "string" ? body.description : "",
        completed: typeof body.completed === "boolean" ? body.completed : false,
        createdAt: now,
        updatedAt: now,
      };
      this.todos.push(newTodo);
      return sendResponse(res, 201, { success: true, data: newTodo });
    } catch (err) {
      if (err && err.message === "Invalid JSON") {
        return sendResponse(res, 400, {
          success: false,
          error: "Invalid JSON",
        });
      }
      console.error("Create todo error:", err);
      return sendResponse(res, 500, {
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Handle PUT /todos/:id - Update existing todo
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   * @param {Object} params - Path parameters
   */
  async updateTodo(req, res, params) {
    const id = params.id;
    const idx = this.findTodoIndexById(id);
    if (idx === -1)
      return sendResponse(res, 404, {
        success: false,
        error: "Todo not found",
      });

    try {
      const body = await parseBody(req);
      const { isValid, errors } = validateTodo(body, true);
      if (!isValid) {
        return sendResponse(res, 400, {
          success: false,
          error: errors.join("; "),
        });
      }

      const todo = this.todos[idx];
      if ("title" in body && body.title != null)
        todo.title = String(body.title).trim();
      if ("description" in body)
        todo.description =
          body.description == null ? "" : String(body.description);
      if ("completed" in body) todo.completed = Boolean(body.completed);
      todo.updatedAt = new Date().toISOString();

      this.todos[idx] = todo;
      return sendResponse(res, 200, { success: true, data: todo });
    } catch (err) {
      if (err && err.message === "Invalid JSON") {
        return sendResponse(res, 400, {
          success: false,
          error: "Invalid JSON",
        });
      }
      console.error("Update todo error:", err);
      return sendResponse(res, 500, {
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Handle DELETE /todos/:id - Delete todo
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   * @param {Object} params - Path parameters
   */
  async deleteTodo(req, res, params) {
    const id = params.id;
    const idx = this.findTodoIndexById(id);
    if (idx === -1)
      return sendResponse(res, 404, {
        success: false,
        error: "Todo not found",
      });
    this.todos.splice(idx, 1);
    return sendResponse(res, 200, {
      success: true,
      message: "Todo deleted successfully",
    });
  }

  /**
   * Handle CORS preflight requests
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   */
  handleCORS(req, res) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
  }

  /**
   * Find todo by ID in storage
   * @param {number|string} id - Todo ID
   * @returns {Object|null} Found todo or null
   */
  findTodoById(id) {
    const numId = parseInt(id, 10);
    if (!Number.isFinite(numId)) return null;
    return this.todos.find((t) => t.id === numId) || null;
  }

  /**
   * Find todo index by ID in storage
   * @param {number|string} id - Todo ID
   * @returns {number} Todo index or -1 if not found
   */
  findTodoIndexById(id) {
    const numId = parseInt(id, 10);
    if (!Number.isFinite(numId)) return -1;
    return this.todos.findIndex((t) => t.id === numId);
  }

  /**
   * Generate next available ID
   * @returns {number} Next ID
   */
  generateNextId() {
    return this.nextId++;
  }
}

// Export the TodoServer class
module.exports = TodoServer;

// Example usage (for testing):
const isReadyToTest = true;

if (isReadyToTest) {
  // Start server for testing
  const server = new TodoServer(3000);
  server.start();

  console.log("🚀 Todo Server starting...");
  console.log("📝 Replace TODO comments with implementation");
  console.log("🧪 Run task-04-test.js to verify functionality");
}

// If this file is run directly, start the server
if (require.main === module) {
  const server = new TodoServer(3000);
  server.start();
}

