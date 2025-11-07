const http = require("http");
const url = require("url");
const Redis = require("ioredis");

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT
  ? parseInt(process.env.REDIS_PORT)
  : 6379;
const TODOS_TTL_SECONDS = process.env.TODOS_TTL_SECONDS
  ? parseInt(process.env.TODOS_TTL_SECONDS)
  : 300;

const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

const users = [
  { id: 1, username: "alice", email: "alice@example.com" },
  { id: 2, username: "bob", email: "bob@example.com" },
];

let todos = [
  {
    id: 1,
    title: "Buy milk",
    description: "2 liters",
    status: "active",
    user_id: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Read book",
    description: "20 pages",
    status: "completed",
    user_id: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
let nextId = 3;

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(payload);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (ch) => (data += ch));
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function cacheKeyForUser(userId) {
  return `todos:user:${userId}`;
}

async function handleRequest(req, res) {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || "/";
  const method = (req.method || "GET").toUpperCase();

  if (method === "OPTIONS") return sendJson(res, 204, {});

  try {
    // GET /todos?userId=#
    if (method === "GET" && pathname === "/todos") {
      const userId =
        parsed.query && parsed.query.userId
          ? String(parsed.query.userId)
          : null;
      if (!userId) {
        return sendJson(res, 200, {
          success: true,
          data: todos,
          count: todos.length,
        });
      }

      const key = cacheKeyForUser(userId);
      try {
        const cached = await redis.get(key);
        if (cached) {
          const cachedData = JSON.parse(cached);
          console.log(`[CACHE] hit for ${key}`);
          return sendJson(res, 200, {
            success: true,
            data: cachedData,
            fromCache: true,
            count: cachedData.length,
          });
        }
      } catch (e) {
        console.warn("Redis read failed:", e && e.message);
      }

      const results = todos.filter((t) => String(t.user_id) === String(userId));
      try {
        await redis.set(key, JSON.stringify(results), "EX", TODOS_TTL_SECONDS);
        console.log(`[CACHE] set ${key} (ttl=${TODOS_TTL_SECONDS}s)`);
      } catch (e) {
        console.warn("Redis set failed:", e && e.message);
      }
      return sendJson(res, 200, {
        success: true,
        data: results,
        fromCache: false,
        count: results.length,
      });
    }

    // POST /todos  (body: { title, description?, status?, user_id })
    if (method === "POST" && pathname === "/todos") {
      let body;
      try {
        body = await parseBody(req);
      } catch (e) {
        return sendJson(res, 400, { success: false, error: "Invalid JSON" });
      }
      if (
        !body ||
        typeof body.title !== "string" ||
        !body.title.trim() ||
        !body.user_id
      ) {
        return sendJson(res, 400, {
          success: false,
          error: "Missing required fields: title and user_id",
        });
      }
      const userId = Number(body.user_id);
      const existingUser = users.find((u) => u.id === userId);
      if (!existingUser)
        return sendJson(res, 400, { success: false, error: "Invalid user_id" });

      const now = new Date().toISOString();
      const newTodo = {
        id: nextId++,
        title: String(body.title).trim(),
        description: body.description ? String(body.description) : "",
        status: body.status ? String(body.status) : "active",
        user_id: userId,
        createdAt: now,
        updatedAt: now,
      };
      todos.push(newTodo);

      const key = cacheKeyForUser(userId);
      try {
        await redis.del(key);
        console.log(`[CACHE] invalidated ${key} after create`);
      } catch (e) {
        console.warn("Redis del failed:", e && e.message);
      }

      return sendJson(res, 201, { success: true, data: newTodo });
    }

    // PUT /todos/:id
    const putMatch = pathname.match(/^\/todos\/(\d+)$/);
    if (method === "PUT" && putMatch) {
      const id = Number(putMatch[1]);
      const idx = todos.findIndex((t) => t.id === id);
      if (idx === -1)
        return sendJson(res, 404, { success: false, error: "Todo not found" });

      let body;
      try {
        body = await parseBody(req);
      } catch (e) {
        return sendJson(res, 400, { success: false, error: "Invalid JSON" });
      }

      if ("title" in body && body.title != null)
        todos[idx].title = String(body.title).trim();
      if ("description" in body)
        todos[idx].description =
          body.description == null ? "" : String(body.description);
      if ("status" in body) todos[idx].status = String(body.status);
      if ("user_id" in body) todos[idx].user_id = Number(body.user_id);
      todos[idx].updatedAt = new Date().toISOString();

      const userKey = cacheKeyForUser(todos[idx].user_id);
      try {
        await redis.del(userKey);
        console.log(`[CACHE] invalidated ${userKey} after update`);
      } catch (e) {
        console.warn("Redis del failed:", e && e.message);
      }

      return sendJson(res, 200, { success: true, data: todos[idx] });
    }

    // DELETE /todos/:id
    const delMatch = pathname.match(/^\/todos\/(\d+)$/);
    if (method === "DELETE" && delMatch) {
      const id = Number(delMatch[1]);
      const idx = todos.findIndex((t) => t.id === id);
      if (idx === -1)
        return sendJson(res, 404, { success: false, error: "Todo not found" });

      const removed = todos.splice(idx, 1)[0];

      const key = cacheKeyForUser(removed.user_id);
      try {
        await redis.del(key);
        console.log(`[CACHE] invalidated ${key} after delete`);
      } catch (e) {
        console.warn("Redis del failed:", e && e.message);
      }

      return sendJson(res, 200, {
        success: true,
        message: "Todo deleted successfully",
      });
    }

    // GET /users - simple list of users (help for testing)
    if (method === "GET" && pathname === "/users") {
      return sendJson(res, 200, { success: true, data: users });
    }

    // GET /cache/user/:id -> show whether key present and value (debug)
    const cacheShowMatch = pathname.match(/^\/cache\/user\/(\d+)$/);
    if (method === "GET" && cacheShowMatch) {
      const uid = cacheShowMatch[1];
      const key = cacheKeyForUser(uid);
      try {
        const v = await redis.get(key);
        return sendJson(res, 200, {
          success: true,
          key,
          present: !!v,
          value: v ? JSON.parse(v) : null,
        });
      } catch (e) {
        return sendJson(res, 500, {
          success: false,
          error: "Redis error",
          detail: e.message,
        });
      }
    }

    return sendJson(res, 404, { success: false, error: "Not Found" });
  } catch (err) {
    console.error("Server error:", err);
    return sendJson(res, 500, {
      success: false,
      error: "Internal server error",
    });
  }
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error("Unhandled handler error:", err);
    try {
      sendJson(res, 500, { success: false, error: "Internal server error" });
    } catch (e) {}
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Redis: ${REDIS_HOST}:${REDIS_PORT}, TTL=${TODOS_TTL_SECONDS}s`);
});

