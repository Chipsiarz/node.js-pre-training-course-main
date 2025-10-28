const fsPromises = require("fs").promises;
const fs = require("fs");

async function processFiles(files = ["file1.txt", "file2.txt", "file3.txt"]) {
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

  await Promise.all(
    files.map((f, idx) =>
      fsPromises.readFile(f, "utf8").then((content) => {
        results[idx] = content.toUpperCase();
      })
    )
  );

  console.log("All files processed:", results);
  return results;
}

if (require.main === module) {
  processFiles().catch((err) => console.error("Error:", err));
}

