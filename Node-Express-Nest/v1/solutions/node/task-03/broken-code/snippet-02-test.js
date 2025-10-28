const fs = require("fs").promises;
const path = require("path");
const { processUserData } = require("./snippet-02");

async function createTestFiles(userId) {
  const user = { id: userId, name: "John", email: "john@example.com" };
  const preferences = { theme: "dark", language: "en" };
  const activity = { lastLogin: "2025-01-01", sessionsCount: 3 };

  await fs.writeFile(`user-${userId}.json`, JSON.stringify(user), "utf8");
  await fs.writeFile(
    `preferences-${userId}.json`,
    JSON.stringify(preferences),
    "utf8"
  );
  await fs.writeFile(
    `activity-${userId}.json`,
    JSON.stringify(activity),
    "utf8"
  );
}

async function cleanupFiles(userId) {
  const files = [
    `user-${userId}.json`,
    `preferences-${userId}.json`,
    `activity-${userId}.json`,
    `processed-${userId}.json`,
  ];
  for (const file of files) {
    try {
      await fs.unlink(file);
    } catch {}
  }
}

(async () => {
  console.log("🔄 Starting simple Node.js tests for snippet-02.js\n");
  const userId = 123;

  // Cleanup before start
  await cleanupFiles(userId);

  // --- Test 1: Happy path ---
  try {
    await createTestFiles(userId);
    const result = await processUserData(userId);

    if (!result.user || !result.preferences || !result.activity) {
      throw new Error("Combined data is missing some sections");
    }

    const output = JSON.parse(
      await fs.readFile(`processed-${userId}.json`, "utf8")
    );
    if (!output.processedAt) throw new Error("Missing processedAt timestamp");

    console.log("✅ Test 1 passed: Processed user data successfully");
  } catch (err) {
    console.error("❌ Test 1 failed:", err.message);
  }

  // --- Test 2: Missing input files ---
  try {
    await cleanupFiles(userId);
    let threw = false;
    try {
      await processUserData(userId);
    } catch {
      threw = true;
    }

    if (!threw) throw new Error("Expected an error for missing input files");
    console.log("✅ Test 2 passed: Properly handled missing files");
  } catch (err) {
    console.error("❌ Test 2 failed:", err.message);
  }

  // Cleanup after tests
  await cleanupFiles(userId);
})();

