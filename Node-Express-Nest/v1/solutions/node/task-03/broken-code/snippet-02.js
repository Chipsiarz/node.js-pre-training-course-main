const fs = require("fs").promises;

async function processUserData(userId) {
  const userFile = `user-${userId}.json`;
  const prefFile = `preferences-${userId}.json`;
  const activityFile = `activity-${userId}.json`;
  const outFile = `processed-${userId}.json`;

  try {
    const userRaw = await fs.readFile(userFile, "utf8");
    const user = JSON.parse(userRaw);

    const prefRaw = await fs.readFile(prefFile, "utf8");
    const preferences = JSON.parse(prefRaw);

    const activityRaw = await fs.readFile(activityFile, "utf8");
    const activity = JSON.parse(activityRaw);

    const combined = {
      user,
      preferences,
      activity,
      processedAt: new Date().toISOString(),
    };
    await fs.writeFile(outFile, JSON.stringify(combined, null, 2), "utf8");
    console.log("Success:", combined);
    return combined;
  } catch (err) {
    console.error("Error processing user data:", err.message);
    throw err;
  }
}

if (require.main === module) {
  processUserData(123).catch((err) => {
    console.error("Process failed:", err.message);
  });
}

module.exports = { processUserData };

