const fs = require("fs");
const fsPromises = require("fs").promises;

/**
 * Event Loop Analysis and Async Debugging
 * Learn Node.js event loop phases and fix broken async code
 */

/** --- HELPERS --- */
function now() {
  return new Date().toISOString();
}

function safeParseJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Analyze execution order of event loop phases
 * @returns {object} Analysis of execution order
 */
function analyzeEventLoop() {
  // TODO: Implement event loop analysis
  // 1. Create examples showing each event loop phase
  // 2. Demonstrate microtask vs macrotask priority
  // 3. Show execution order with detailed logging
  // 4. Return analysis object with explanations

  const phases = [
    "timers",
    "pending callbacks",
    "idle, prepare",
    "poll",
    "check",
    "close callbacks",
  ];

  const phasesDetailed = [
    { name: "timers", description: "setTimeout, setInterval callbacks" },
    {
      name: "pending callbacks",
      description: "I/O callbacks deferred to next loop iteration",
    },
    { name: "idle, prepare", description: "internal use, prepare for poll" },
    {
      name: "poll",
      description: "retrieves new I/O events; executes I/O callbacks",
    },
    { name: "check", description: "setImmediate callbacks" },
    {
      name: "close callbacks",
      description: "e.g. socket.on('close') callbacks",
    },
  ];

  const microtaskVsMacrotask = {
    microtasks: [
      "process.nextTick (highest priority)",
      "Promise.then / queueMicrotask",
    ],
    macrotasks: [
      "setTimeout / setInterval (timers)",
      "setImmediate (check)",
      "I/O callbacks (poll)",
    ],
    note: "process.nextTick runs before Promise microtasks; microtasks flush completely before moving to next event-loop phase.",
  };

  const executionOrderPrinciples = [
    "Synchronous code (top-level) runs first.",
    "After sync code, process.nextTick callbacks run (microtask, highest priority).",
    "Then other microtasks (Promise.then / queueMicrotask) run.",
    "After microtasks flush, Node enters event loop phases in order (timers -> pending callbacks -> poll -> check -> close).",
    "setImmediate runs in the check phase and often runs after poll; ordering between timers and setImmediate can vary depending on I/O.",
  ];

  const executionOrder = [
    "sync start",
    "process.nextTick",
    "Promise.then",
    "setTimeout",
    "fs.readFile callback",
    "setImmediate",
    "sync end",
  ];

  const explanations = [
    "Synchronous code runs first.",
    "process.nextTick is the highest-priority microtask and runs before other microtasks like Promise.then.",
    "Promise.then callbacks run after nextTick but before macrotasks.",
    "setTimeout callbacks are macrotasks, executed in the timers phase.",
    "I/O callbacks (like fs.readFile) run in the poll phase.",
    "setImmediate callbacks run in the check phase, usually after poll.",
    "Microtasks flush completely before Node moves to the next event loop phase.",
  ];

  return {
    phases,
    phasesDetailed,
    microtaskVsMacrotask,
    executionOrderPrinciples,
    executionOrder,
    explanations,
  };
}

/**
 * Predict execution order for code snippets
 * @param {string} snippet - Code snippet identifier
 * @returns {array} Predicted execution order
 */
function predictExecutionOrder(snippet) {
  // TODO: Implement execution order prediction
  // 1. Analyze the provided code snippets
  // 2. Apply event loop phase rules
  // 3. Consider microtask priority
  // 4. Return predicted order with explanations

  const key = String(snippet).toLowerCase();

  if (
    ["snippet-01", "snippet01", "snippet1", "snippet-1"].some((k) =>
      key.includes(k)
    )
  ) {
    return [
      "Start",
      "End",
      "Next Tick 1",
      "Next Tick 2",
      "Promise 1",
      "Promise 2",
      "Timer 1",
      "Timer 2",
      "Immediate 1",
      "Immediate 2",
    ];
  }

  if (
    ["snippet-02", "snippet02", "snippet2", "snippet-2"].some((k) =>
      key.includes(k)
    )
  ) {
    return [
      "=== Start ===",
      "=== End ===",
      "NextTick",
      "Nested NextTick",
      "Timer",
      "Immediate",
      "fs.readFile",
      "NextTick in readFile",
      "Timer in readFile",
      "Immediate in readFile",
    ];
  }

  return [];
}

/**
 * Fix race condition in file processing
 * @returns {Promise} Promise that resolves when files are processed
 */
async function fixRaceCondition(
  files = ["file1.txt", "file2.txt", "file3.txt"]
) {
  // TODO: Fix the race condition in file processing
  // Issues to fix:
  // 1. Race condition in file processing
  // 2. Incorrect error handling
  // 3. Missing await keywords
  // 4. Array index might be wrong due to closure

  const results = new Array(files.length);

  await Promise.all(
    files.map(async (f) => {
      try {
        await fsPromises.access(f, fs.constants.R_OK);
      } catch {
        await fsPromises.writeFile(f, `Content of ${f}`, "utf8");
      }
    })
  );

  const readers = files.map((f, idx) =>
    fsPromises.readFile(f, "utf8").then((content) => {
      results[idx] = content.toUpperCase();
    })
  );

  await Promise.all(readers);

  console.log(now(), "All files processed:", results);
  return results;
}

/**
 * Convert callback hell to async/await
 * @param {number} userId - User ID to process
 * @returns {Promise} Promise that resolves with processed user data
 */
async function fixCallbackHell(userId) {
  // TODO: Convert callback hell to async/await
  // Issues to fix:
  // 1. Callback hell structure
  // 2. No error handling for JSON.parse
  // 3. Repetitive error handling code
  // 4. No file existence checking
  // 5. Blocking operations

  const userFile = `user-${userId}.json`;
  const prefFile = `preferences-${userId}.json`;
  const activityFile = `activity-${userId}.json`;
  const outFile = `processed-${userId}.json`;

  async function readJsonSafe(path) {
    try {
      const raw = await fsPromises.readFile(path, "utf8");
      const parsed = safeParseJson(raw);
      if (!parsed) throw new Error(`Invalid JSON in ${path}`);
      return parsed;
    } catch (err) {
      throw new Error(`Failed to read/parse ${path}: ${err.message}`);
    }
  }

  try {
    const user = await readJsonSafe(userFile);
    const preferences = await readJsonSafe(prefFile);
    const activity = await readJsonSafe(activityFile);

    const combinedData = {
      user,
      preferences,
      activity,
      processedAt: new Date().toISOString(),
    };

    await fsPromises.writeFile(
      outFile,
      JSON.stringify(combinedData, null, 2),
      "utf8"
    );
    console.log(now(), "Processed user data written to", outFile);
    return combinedData;
  } catch (err) {
    console.error(now(), "Error processing user data:", err.message);

    try {
      await fsPromises.writeFile(
        userFile,
        JSON.stringify(
          { id: userId, name: "Sample", email: "sample@example.com" },
          null,
          2
        )
      );
      await fsPromises.writeFile(
        prefFile,
        JSON.stringify({ theme: "dark", language: "en" }, null, 2)
      );
      await fsPromises.writeFile(
        activityFile,
        JSON.stringify(
          { lastLogin: new Date().toISOString(), sessionsCount: 1 },
          null,
          2
        )
      );
      console.log(now(), "Created sample files. Please run again.");
    } catch (writeErr) {
      console.error(now(), "Failed creating sample files:", writeErr.message);
    }

    throw err;
  }
}

/**
 * Fix mixed promises and callbacks
 * @returns {Promise} Promise that resolves when processing is complete
 */
async function fixMixedAsync() {
  // TODO: Fix mixed promises and callbacks
  // Issues to fix:
  // 1. Mixing promises and callbacks inconsistently
  // 2. Nested async operations without proper chaining
  // 3. Error handling inconsistencies
  // 4. No proper async/await usage

  const inputFile = "input.txt";
  const outputFile = "output.txt";

  try {
    console.log("processing");
    const data = await fsPromises.readFile(inputFile, "utf8");
    console.log("File read successfully");

    const processedData = data.toUpperCase();

    await fsPromises.writeFile(outputFile, processedData, "utf8");
    console.log("File written successfully");

    const verifyData = await fsPromises.readFile(outputFile, "utf8");
    console.log("Verification successful");
    console.log("Data length:", verifyData.length);

    console.log("completed");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      console.log("input file not found, creating one...");
      await fsPromises.writeFile(inputFile, "Hello World!", "utf8");
      console.log("Created input file, please run again");
    } else {
      console.error(
        "Error in fixMixedAsync:",
        error && error.message ? error.message : error
      );
      throw error;
    }
  }
}

/**
 * Demonstrate all event loop phases
 * @returns {Promise} Promise that resolves when demonstration is complete
 */
async function demonstrateEventLoop() {
  // TODO: Create comprehensive event loop demonstration
  // 1. Show timers phase (setTimeout, setInterval)
  // 2. Show pending callbacks phase
  // 3. Show poll phase (I/O operations)
  // 4. Show check phase (setImmediate)
  // 5. Show close callbacks phase
  // 6. Demonstrate microtask priority (nextTick, Promises)

  console.log("DEMO: start (sync)");

  process.nextTick(() => console.log("DEMO: process.nextTick (microtask)"));
  console.log("nextTick");

  Promise.resolve()
    .then(() => console.log("DEMO: Promise.then (microtask)"))
    .catch(() => {});
  console.log("promises");

  setTimeout(() => {
    console.log("DEMO: setTimeout (timers)");
    console.log("timers");
  }, 0);

  setImmediate(() => {
    console.log("DEMO: setImmediate (check)");
    console.log("immediate");
  });

  fs.readFile(__filename, () => {
    console.log("DEMO: fs.readFile callback (poll)");
    setTimeout(() => console.log("DEMO: timer inside readFile"), 0);
    setImmediate(() => console.log("DEMO: immediate inside readFile"));
    process.nextTick(() => console.log("DEMO: nextTick inside readFile"));
  });

  console.log("DEMO: end (sync)");
}

/**
 * Create test files for debugging exercises
 */
async function createTestFiles() {
  // TODO: Create test files for the exercises
  // 1. Create sample user data files
  // 2. Create input files for processing
  // 3. Handle file creation errors gracefully

  const testData = {
    "user-123.json": {
      id: 123,
      name: "John Doe",
      email: "john@example.com",
    },
    "preferences-123.json": {
      theme: "dark",
      language: "en",
      notifications: true,
    },
    "activity-123.json": {
      lastLogin: "2025-01-01",
      sessionsCount: 42,
      totalTime: 3600,
    },
    "input.txt": "Hello World! This is test data for processing.",
    "file1.txt": "Content of file 1",
    "file2.txt": "Content of file 2",
    "file3.txt": "Content of file 3",
  };

  const promises = Object.entries(testData).map(([name, content]) =>
    fsPromises.writeFile(
      name,
      typeof content === "string" ? content : JSON.stringify(content, null, 2),
      "utf8"
    )
  );

  await Promise.all(promises);
  console.log(now(), "Test files created");
}

/**
 * Helper function to log with timestamps
 * @param {string} message - Message to log
 * @param {string} phase - Event loop phase
 */
function logWithPhase(message, phase = "unknown") {
  // TODO: Implement detailed logging
  // 1. Add timestamp
  // 2. Add event loop phase information
  // 3. Add color coding for different phases
  // 4. Format output for better readability

  console.log(`[${phase}] ${now()} - ${message}`);
}

// Export functions and data
module.exports = {
  analyzeEventLoop,
  predictExecutionOrder,
  fixRaceCondition,
  fixCallbackHell,
  fixMixedAsync,
  demonstrateEventLoop,
  createTestFiles,
  logWithPhase,
};

// Example usage (for testing):
const isReadyToTest = true;

if (isReadyToTest) {
  async function runExamples() {
    console.log("🔄 Starting Event Loop Analysis Examples...\n");

    // Create test files
    await createTestFiles();

    // Demonstrate event loop
    console.log("=== Event Loop Demonstration ===");
    await demonstrateEventLoop();

    // Analyze execution order
    console.log("\n=== Execution Order Analysis ===");
    const analysis = analyzeEventLoop();
    console.log("Analysis:", analysis);

    // Fix broken code
    console.log("\n=== Fixing Broken Code ===");
    try {
      await fixRaceCondition();
      console.log("✅ Race condition fixed");

      await fixCallbackHell(123);
      console.log("✅ Callback hell converted");

      await fixMixedAsync();
      console.log("✅ Mixed async resolved");
    } catch (error) {
      console.error("❌ Error fixing code:", error.message);
    }
  }

  runExamples();
}

