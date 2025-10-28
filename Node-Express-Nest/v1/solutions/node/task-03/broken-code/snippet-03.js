const fs = require("fs").promises;

async function processData() {
  console.log("Starting data processing...");
  try {
    try {
      await fs.access("input.txt");
    } catch {
      await fs.writeFile("input.txt", "Hello World!", "utf8");
      console.log("Created input.txt");
    }

    const data = await fs.readFile("input.txt", "utf8");
    console.log("File read successfully");

    const processed = data.toUpperCase();
    await fs.writeFile("output.txt", processed, "utf8");
    console.log("File written successfully");

    const verifyData = await fs.readFile("output.txt", "utf8");
    console.log("Verification successful");
    console.log("Data length:", verifyData.length);
    return true;
  } catch (err) {
    console.error("Processing error:", err);
    throw err;
  }
}

if (require.main === module) {
  processData().catch(() => {});
}

module.exports = { processData };
