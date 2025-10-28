const fs = require("fs").promises;
const { processData } = require("./snippet-03");

async function cleanupFiles() {
  for (const file of ["input.txt", "output.txt"]) {
    try {
      await fs.unlink(file);
    } catch {}
  }
}

(async () => {
  console.log("🔄 Starting simple Node.js tests for snippet-03.js\n");

  // --- Test 1: Creates input file if missing ---
  try {
    await cleanupFiles();
    const result = await processData();

    const inputExists = await fs
      .access("input.txt")
      .then(() => true)
      .catch(() => false);

    const outputExists = await fs
      .access("output.txt")
      .then(() => true)
      .catch(() => false);

    if (!inputExists) throw new Error("input.txt was not created");
    if (!outputExists) throw new Error("output.txt was not created");
    if (!result) throw new Error("processData did not return true");

    console.log(
      "✅ Test 1 passed: Created missing input file and processed data"
    );
  } catch (err) {
    console.error("❌ Test 1 failed:", err.message);
  }

  // --- Test 2: Works correctly when input file already exists ---
  try {
    await fs.writeFile("input.txt", "custom test content", "utf8");
    const result = await processData();

    const output = await fs.readFile("output.txt", "utf8");
    if (!output.includes("CUSTOM TEST CONTENT")) {
      throw new Error("Output content not properly uppercased");
    }

    if (!result) throw new Error("processData did not return true");

    console.log("✅ Test 2 passed: Processed existing input file correctly");
  } catch (err) {
    console.error("❌ Test 2 failed:", err.message);
  }

  // --- Test 3: Throws on write error (simulate permission issue) ---
  try {
    await cleanupFiles();
    await fs.writeFile("input.txt", "test", "utf8");

    // Monkey-patch fs.writeFile to throw
    const originalWrite = fs.writeFile;
    fs.writeFile = async () => {
      throw new Error("Simulated write error");
    };

    let threw = false;
    try {
      await processData();
    } catch {
      threw = true;
    }

    fs.writeFile = originalWrite;

    if (!threw) throw new Error("Expected processData to throw on write error");

    console.log("✅ Test 3 passed: Properly handled write error");
  } catch (err) {
    console.error("❌ Test 3 failed:", err.message);
  }

  await cleanupFiles();
})();

