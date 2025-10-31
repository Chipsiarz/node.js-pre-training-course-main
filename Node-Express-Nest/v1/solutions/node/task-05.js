/**
 * task-05.js
 * Extend your Task 04 server by adding EventEmitter functionality,
 * logging, analytics, and new endpoints.
 *
 * Implement all TODOs below.
 */

const http = require("http");
const url = require("url");
const { EventEmitter } = require("events");

// ---------- Utilities ----------

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(data);
}

function parseIdFromPath(pathname) {
  const m = pathname.match(/^\/todos\/(\d+)$/);
  return m ? Number(m[1]) : null;
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        const json = JSON.parse(data);
        resolve(json);
      } catch (e) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function nowISO() {
  return new Date().toISOString();
}

// ---------- Analytics ----------

class AnalyticsTracker {
  constructor() {
    this.stats = {
      totalCreated: 0,
      totalUpdated: 0,
      totalDeleted: 0,
      totalViews: 0,
      errors: 0,
      dailyStats: {},
    };
  }

  _todayKey() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  _ensureDay(key) {
    if (!this.stats.dailyStats[key]) {
      this.stats.dailyStats[key] = {
        created: 0,
        updated: 0,
        deleted: 0,
        views: 0,
      };
    }
  }

  _bumpDaily(field) {
    const key = this._todayKey();
    this._ensureDay(key);
    if (field in this.stats.dailyStats[key]) {
      this.stats.dailyStats[key][field]++;
    }
  }

  trackCreated() {
    this.stats.totalCreated++;
    this._bumpDaily("created");
  }
  trackUpdated() {
    this.stats.totalUpdated++;
    this._bumpDaily("updated");
  }
  trackDeleted() {
    this.stats.totalDeleted++;
    this._bumpDaily("deleted");
  }
  trackViewed() {
    this.stats.totalViews++;
    this._bumpDaily("views");
  }
  trackError() {
    this.stats.errors++;
  }

  getStats() {
    return {
      totalCreated: this.stats.totalCreated,
      totalUpdated: this.stats.totalUpdated,
      totalDeleted: this.stats.totalDeleted,
      totalViews: this.stats.totalViews,
      errors: this.stats.errors,
      dailyStats: { ...this.stats.dailyStats },
    };
  }
}

// ---------- Console Logger ----------
class ConsoleLogger {
  todoCreated(data) {
    console.log(
      `📝 [${data.timestamp}] Created "${data.todo.title}" (ID: ${data.todo.id})`
    );
  }
  todoUpdated(data) {
    console.log(
      `✏️  [${data.timestamp}] Updated ID ${
        data.newTodo.id
      }; changed: ${data.changes.join(", ")}`
    );
  }
  todoDeleted(data) {
    console.log(
      `🗑️  [${data.timestamp}] Deleted "${data.todo.title}" (ID: ${data.todo.id})`
    );
  }
  todoViewed(data) {
    console.log(`👁️  [${data.timestamp}] Viewed ID ${data.todo.id}`);
  }
  todosListed(data) {
    console.log(`📃 [${data.timestamp}] Listed todos count=${data.count}`);
  }
  todoNotFound(data) {
    console.warn(
      `⚠️  [${data.timestamp}] Not found: id=${data.todoId} op=${data.operation}`
    );
  }
  validationError(data) {
    console.error(
      `❌ [${data.timestamp}] Validation error: ${data.errors.join(", ")}`
    );
  }
  serverError(data) {
    console.error(
      `💥 [${data.timestamp}] Server error in ${data.operation}: ${
        data.error && data.error.message
      }`
    );
  }
}

// ---------- Validation ----------
function validateTodoPayload(payload, isCreate = false) {
  const errors = [];
  const out = {};

  if (isCreate || "title" in payload) {
    if (
      !("title" in payload) ||
      payload.title === undefined ||
      payload.title === null
    ) {
      if (isCreate) errors.push("Title is required");
    } else {
      if (typeof payload.title !== "string") {
        errors.push("Title must be a string");
      } else {
        const t = payload.title.trim();
        if (t.length < 1 || t.length > 100) {
          errors.push("Title must be 1-100 characters and not only whitespace");
        } else {
          out.title = t;
        }
      }
    }
  }

  if ("description" in payload) {
    if (payload.description == null) {
      out.description = "";
    } else if (typeof payload.description !== "string") {
      errors.push("Description must be a string");
    } else {
      if (payload.description.length > 500) {
        errors.push("Description must be at most 500 characters");
      } else {
        out.description = payload.description;
      }
    }
  }

  if ("completed" in payload) {
    if (typeof payload.completed !== "boolean") {
      errors.push("Completed must be a boolean");
    } else {
      out.completed = payload.completed;
    }
  }

  if (isCreate) {
    if (!("description" in out)) out.description = "";
    if (!("completed" in out)) out.completed = false;
  }

  return { errors, values: out };
}

class TodoServer extends EventEmitter {
  constructor(port = 3000) {
    super();
    this.port = port;
    this.todos = [];
    this.nextId = 1;

    this.analytics = new AnalyticsTracker();
    this.logger = new ConsoleLogger();
    this.recentEvents = [];

    this.server = null;

    this.initializeSampleData();

    this._wireDefaultListeners();
  }

  initializeSampleData() {
    this.todos = [];
    this.nextId = 1;
  }

  _wireDefaultListeners() {
    const remember = (eventType) => (data) => {
      this.recentEvents.push({ eventType, timestamp: nowISO(), data });
      if (this.recentEvents.length > 100) this.recentEvents.shift();
    };
    // Remember all key events for /events
    [
      "todoCreated",
      "todoUpdated",
      "todoDeleted",
      "todoViewed",
      "todosListed",
      "todoNotFound",
      "validationError",
      "serverError",
    ].forEach((evt) => this.on(evt, remember(evt)));

    // Logging
    this.on("todoCreated", (d) => this.logger.todoCreated(d));
    this.on("todoUpdated", (d) => this.logger.todoUpdated(d));
    this.on("todoDeleted", (d) => this.logger.todoDeleted(d));
    this.on("todoViewed", (d) => this.logger.todoViewed(d));
    this.on("todosListed", (d) => this.logger.todosListed(d));
    this.on("todoNotFound", (d) => this.logger.todoNotFound(d));
    this.on("validationError", (d) => this.logger.validationError(d));
    this.on("serverError", (d) => this.logger.serverError(d));

    // Analytics
    this.on("todoCreated", () => this.analytics.trackCreated());
    this.on("todoUpdated", () => this.analytics.trackUpdated());
    this.on("todoDeleted", () => this.analytics.trackDeleted());
    this.on("todoViewed", () => this.analytics.trackViewed());
    this.on("validationError", () => this.analytics.trackError());
    this.on("serverError", () => this.analytics.trackError());
  }

  /**
   * Start the server
   */
  async start() {
    this.server = http.createServer((req, res) => {
      this._handleRequest(req, res).catch((err) => {
        try {
          const requestInfo = {
            method: req.method,
            url: req.url,
            userAgent: req.headers["user-agent"],
            ip: req.socket.remoteAddress,
          };
          this.emit("serverError", {
            error: err,
            operation: "_handleRequest",
            requestInfo,
            timestamp: nowISO(),
          });
        } catch (e) {}
        try {
          sendJson(res, 500, {
            success: false,
            error: "Internal server error",
          });
        } catch (e) {}
      });
    });

    await new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log("=== Todo Server with Events Started ===");
        console.log(`Server running on http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the server
   */
  async stop() {
    if (!this.server) return;
    await new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) return reject(err);
        this.server = null;
        resolve();
      });
    });
  }

  /**
   * Handle incoming requests
   */
  async _handleRequest(req, res) {
    const parsed = url.parse(req.url || "", true);
    const pathname = parsed.pathname || "/";
    const method = (req.method || "GET").toUpperCase();

    const requestInfo = {
      method,
      url: req.url,
      userAgent: req.headers["user-agent"] || "",
      ip:
        req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : "",
    };

    if (method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }

    try {
      // GET /analytics
      if (method === "GET" && pathname === "/analytics") {
        const stats = this.analytics.getStats();
        return sendJson(res, 200, { success: true, data: stats });
      }

      // GET /events?last=n
      if (method === "GET" && pathname === "/events") {
        const last =
          parseInt(
            parsed.query && parsed.query.last ? parsed.query.last : "10",
            10
          ) || 10;
        const events = this.recentEvents.slice(-Math.max(0, last));
        return sendJson(res, 200, { success: true, data: events });
      }

      // GET /todos
      if (method === "GET" && pathname === "/todos") {
        let results = [...this.todos];
        const filters = {};
        if (parsed.query && "completed" in parsed.query) {
          const q = String(parsed.query.completed).toLowerCase();
          if (q === "true" || q === "false") {
            const f = q === "true";
            results = results.filter((t) => Boolean(t.completed) === f);
            filters.completed = f;
          } else {
            // invalid filter -> 400
            this.emit("validationError", {
              errors: ["Invalid completed query parameter"],
              data: parsed.query,
              requestInfo,
              timestamp: nowISO(),
            });
            return sendJson(res, 400, {
              success: false,
              error: "Invalid completed query parameter",
            });
          }
        }
        // emit event
        this.emit("todosListed", {
          todos: results,
          count: results.length,
          filters,
          timestamp: nowISO(),
          requestInfo,
        });
        return sendJson(res, 200, {
          success: true,
          data: results,
          count: results.length,
        });
      }

      // GET /todos/:id
      const id = parseIdFromPath(pathname);
      if (method === "GET" && id != null) {
        const todo = this.todos.find((t) => t.id === id);
        if (!todo) {
          this.emit("todoNotFound", {
            todoId: id,
            operation: "get",
            timestamp: nowISO(),
            requestInfo,
          });
          return sendJson(res, 404, {
            success: false,
            error: "Todo not found",
          });
        }
        this.emit("todoViewed", { todo, timestamp: nowISO(), requestInfo });
        return sendJson(res, 200, { success: true, data: todo });
      }

      // POST /todos
      if (method === "POST" && pathname === "/todos") {
        let body;
        try {
          body = await parseBody(req);
        } catch (e) {
          this.emit("validationError", {
            errors: ["Invalid JSON"],
            data: null,
            requestInfo,
            timestamp: nowISO(),
          });
          return sendJson(res, 400, { success: false, error: "Invalid JSON" });
        }

        const { errors, values } = validateTodoPayload(body, true);
        if (errors.length) {
          this.emit("validationError", {
            errors,
            data: body,
            requestInfo,
            timestamp: nowISO(),
          });
          return sendJson(res, 400, {
            success: false,
            error: errors.join("; "),
          });
        }

        const now = nowISO();
        const newTodo = {
          id: this.nextId++,
          title: values.title,
          description: values.description || "",
          completed: values.completed || false,
          createdAt: now,
          updatedAt: now,
        };
        this.todos.push(newTodo);
        this.emit("todoCreated", {
          todo: newTodo,
          timestamp: now,
          requestInfo,
        });
        return sendJson(res, 201, { success: true, data: newTodo });
      }

      // PUT /todos/:id
      if (method === "PUT" && id != null) {
        const idx = this.todos.findIndex((t) => t.id === id);
        if (idx === -1) {
          this.emit("todoNotFound", {
            todoId: id,
            operation: "update",
            timestamp: nowISO(),
            requestInfo,
          });
          return sendJson(res, 404, {
            success: false,
            error: "Todo not found",
          });
        }

        let body;
        try {
          body = await parseBody(req);
        } catch (e) {
          this.emit("validationError", {
            errors: ["Invalid JSON"],
            data: null,
            requestInfo,
            timestamp: nowISO(),
          });
          return sendJson(res, 400, { success: false, error: "Invalid JSON" });
        }

        const { errors, values } = validateTodoPayload(body, false);
        if (errors.length) {
          this.emit("validationError", {
            errors,
            data: body,
            requestInfo,
            timestamp: nowISO(),
          });
          return sendJson(res, 400, {
            success: false,
            error: errors.join("; "),
          });
        }

        const oldTodo = { ...this.todos[idx] };
        if ("title" in values) oldTodo.title = oldTodo.title; // noop; we already have old snapshot
        // apply changes
        if ("title" in body && body.title != null)
          this.todos[idx].title = String(body.title).trim();
        if ("description" in body)
          this.todos[idx].description =
            body.description == null ? "" : String(body.description);
        if ("completed" in body)
          this.todos[idx].completed = Boolean(body.completed);
        this.todos[idx].updatedAt = nowISO();

        const newTodo = { ...this.todos[idx] };
        // compute changed fields
        const changes = [];
        ["title", "description", "completed"].forEach((k) => {
          if (String(oldTodo[k]) !== String(newTodo[k])) changes.push(k);
        });

        this.emit("todoUpdated", {
          oldTodo,
          newTodo,
          changes,
          timestamp: nowISO(),
          requestInfo,
        });
        return sendJson(res, 200, { success: true, data: newTodo });
      }

      // DELETE /todos/:id
      if (method === "DELETE" && id != null) {
        const idx = this.todos.findIndex((t) => t.id === id);
        if (idx === -1) {
          this.emit("todoNotFound", {
            todoId: id,
            operation: "delete",
            timestamp: nowISO(),
            requestInfo,
          });
          return sendJson(res, 404, {
            success: false,
            error: "Todo not found",
          });
        }
        const removed = this.todos.splice(idx, 1)[0];
        this.emit("todoDeleted", {
          todo: removed,
          timestamp: nowISO(),
          requestInfo,
        });
        return sendJson(res, 200, {
          success: true,
          message: "Todo deleted successfully",
        });
      }

      // unknown route
      return sendJson(res, 404, { success: false, error: "Not Found" });
    } catch (err) {
      // unexpected server error
      this.emit("serverError", {
        error: err,
        operation: "_handleRequest",
        requestInfo,
        timestamp: nowISO(),
      });
      return sendJson(res, 500, {
        success: false,
        error: "Internal server error",
      });
    }
  }
}

module.exports = { TodoServer };

