const EventEmitter = require("events");
const fs = require("fs");
const path = require("path");

/**
 * Custom Event Emitter for a messaging system
 * Extend Node.js EventEmitter to create a pub-sub messaging system
 */
class MessageSystem extends EventEmitter {
  constructor() {
    super();
    // Initialize the messaging system
    this.messages = [];
    this.users = new Map();
    this.messageId = 1;
    this.storageFile = path.join(__dirname, "messages.json");
    this.loadMessages();
  }

  //Bonus 1: Persistence
  loadMessages() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, "utf-8");
        this.messages = JSON.parse(data);
        console.log("Loaded previous messages from file.");
      }
    } catch (err) {
      console.error("Failed to load message history:", err.message);
    }
  }

  saveMessages() {
    try {
      fs.writeFileSync(
        this.storageFile,
        JSON.stringify(this.messages, null, 2)
      );
    } catch (err) {
      console.error("Failed to save messages:", err.message);
    }
  }

  sendMessage(type, content, sender = "System") {
    const validTypes = ["message", "notification", "alert"];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid message type: ${type}`);
    }

    // Bonus 3: Rate limiting (max 5 messages per 10s)
    if (sender !== "System") {
      const user = this.users.get(sender);
      if (user) {
        const now = Date.now();
        user.sentMessages = user.sentMessages.filter((t) => now - t < 10_000);
        if (user.sentMessages.length >= 5) {
          throw new Error(`${sender} is sending messages too fast.`);
        }
        user.sentMessages.push(now);
      }
    }

    const message = {
      id: this.messageId++,
      type,
      content,
      timestamp: new Date(),
      sender,
    };

    this.messages.push(message);
    if (this.messages.length > 100) this.messages.shift();

    this.saveMessages();
    this.emit("message", message);
    this.emit(type, message);

    return message;
  }

  subscribeToMessages(callback) {
    this.on("message", callback);
  }

  subscribeToType(type, callback) {
    this.on(type, callback);
  }

  getUserCount() {
    return this.users.size;
  }

  getMessageHistory(count = 10) {
    return this.messages.slice(-count);
  }

  addUser(username, role = "user") {
    if (!username) return;
    if (!this.users.has(username)) {
      this.users.set(username, { role, sentMessages: [] });
      const message = {
        id: this.messageId++,
        type: "user-joined",
        content: `${username} (${role}) joined the system.`,
        timestamp: new Date(),
        sender: "System",
      };
      this.emit("user-joined", message);
    }
  }

  removeUser(username) {
    if (this.users.has(username)) {
      this.users.delete(username);
      const message = {
        id: this.messageId++,
        type: "user-left",
        content: `${username} left the system.`,
        timestamp: new Date(),
        sender: "System",
      };
      this.emit("user-left", message);
    }
  }

  getActiveUsers() {
    return Array.from(this.users.keys());
  }

  clearHistory() {
    this.messages = [];
    this.emit("history-cleared", { timestamp: new Date() });
  }

  getStats() {
    const messagesByType = this.messages.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalMessages: this.messages.length,
      activeUsers: this.getUserCount(),
      messagesByType,
      lastMessageTime: this.messages.at(-1)?.timestamp || null,
    };
  }

  // Bonus 2: Search and filter
  searchMessages(query) {
    const lower = query.toLowerCase();
    return this.messages.filter(
      (msg) =>
        msg.content.toLowerCase().includes(lower) ||
        msg.sender.toLowerCase().includes(lower) ||
        msg.type.toLowerCase().includes(lower)
    );
  }

  // Bonus 4: Check role permissions
  hasPermission(username, action) {
    const user = this.users.get(username);
    if (!user) return false;
    const role = user.role;

    const permissions = {
      admin: ["send", "remove", "view"],
      user: ["send", "view"],
      guest: ["view"],
    };

    return permissions[role]?.includes(action);
  }
}

// Export the MessageSystem class
module.exports = MessageSystem;

// Example usage (for testing):
const isReadyToTest = true;

if (isReadyToTest) {
  const messenger = new MessageSystem();

  // Subscribe to all messages
  messenger.subscribeToMessages((message) => {
    console.log(`[${message.type.toUpperCase()}] ${message.content}`);
  });

  // Subscribe to specific alert messages
  messenger.subscribeToType("alert", (message) => {
    console.log(`🚨 ALERT: ${message.content}`);
  });

  // Subscribe to user events
  messenger.subscribeToType("user-joined", (message) => {
    console.log(`👋 ${message.content}`);
  });

  messenger.subscribeToType("user-left", (message) => {
    console.log(`👋 ${message.content}`);
  });

  // Add users
  messenger.addUser("Eve", "admin");
  messenger.addUser("Alice");
  messenger.addUser("Bob");

  // Send various messages
  messenger.sendMessage("message", "Hello everyone!", "Alice");
  messenger.sendMessage("notification", "System maintenance in 1 hour");
  messenger.sendMessage("alert", "Server overload detected!");

  // Remove user
  messenger.removeUser("Bob");

  // Check system status
  console.log(`\nActive users: ${messenger.getUserCount()}`);
  console.log("Recent messages:", messenger.getMessageHistory()?.length);
  console.log("System stats:", messenger.getStats());

  // Check permission
  console.log("Eve can remove:", messenger.hasPermission("Eve", "remove"));
  console.log("Alice can remove:", messenger.hasPermission("Alice", "remove"));

  // Rate limiting

  console.log("Testing rate limiting (max 5 messages / 10s):");

  try {
    for (let i = 1; i <= 6; i++) {
      messenger.sendMessage("message", `Spam message #${i}`, "Alice");
      console.log(`Sent message #${i}`);
    }
  } catch (err) {
    console.error(`Rate limit triggered: ${err.message}`);
  }
}

