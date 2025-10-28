const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const assert = require("assert");
const { processFiles } = require("./snippet-01");

(async () => {
  console.log("🔄 Starting simple Node.js tests for snippet-01.js");

  const TMP_DIR = path.join(__dirname, "test-tmp");
  await fsPromises.mkdir(TMP_DIR, { recursive: true });
  process.chdir(TMP_DIR);

  const tests = [];

  // --- Test 1: creating missing files ---
  tests.push(
    (async () => {
      const files = ["a.txt", "b.txt", "c.txt"];
      const result = await processFiles(files);

      files.forEach((f) => {
        assert(
          fs.existsSync(path.join(TMP_DIR, f)),
          `❌ File ${f} was not created`
        );
      });

      assert(Array.isArray(result), "❌ Result is not an array");
      assert(result.length === files.length, "❌ Wrong result length");
      console.log("✅ Test 1 passed: Missing files were created and processed");
    })()
  );

  // --- Test 2: does not overwrite existing files ---
  tests.push(
    (async () => {
      const file = "existing.txt";
      await fsPromises.writeFile(file, "Original Content", "utf8");
      const result = await processFiles([file]);
      const content = await fsPromises.readFile(file, "utf8");

      assert.strictEqual(
        content,
        "Original Content",
        "❌ File was overwritten"
      );
      assert.strictEqual(
        result[0],
        "ORIGINAL CONTENT",
        "❌ Result not uppercased"
      );
      console.log(
        "✅ Test 2 passed: Existing file not overwritten and processed correctly"
      );
    })()
  );

  // --- Test 3: works with an empty list ---
  tests.push(
    (async () => {
      const result = await processFiles([]);
      assert.deepStrictEqual(
        result,
        [],
        "❌ Expected empty array for empty input"
      );
      console.log("✅ Test 3 passed: Empty list handled correctly");
    })()
  );

  // --- Run all tests ---
  try {
    await Promise.all(tests);
    console.log("\n🎉 All tests passed successfully!");
  } catch (err) {
    console.error("\n❌ Test failed:", err.message);
    process.exitCode = 1;
  } finally {
    // Cleaning
    const files = await fsPromises.readdir(TMP_DIR);
    await Promise.all(
      files.map((f) => fsPromises.unlink(path.join(TMP_DIR, f)))
    );
    process.chdir(__dirname);
    await fsPromises.rmdir(TMP_DIR);
  }
})();

