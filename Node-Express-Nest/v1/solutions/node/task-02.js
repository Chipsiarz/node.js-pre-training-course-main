const fs = require("fs");
const { Transform } = require("stream");
const { pipeline } = require("stream/promises");
const path = require("path");

class CSVParser extends Transform {
  constructor(options = {}) {
    super({ objectMode: true });
    // TODO: Initialize properties
    // - this.headers = null;
    // - this.lineNumber = 0;
    // - this.buffer = '';

    this.headers = null;
    this.lineNumber = 0;
    this.buffer = "";
  }

  _transform(chunk, encoding, callback) {
    // TODO: Implement CSV parsing
    // 1. Convert chunk to string and add to buffer
    // 2. Split buffer by newlines
    // 3. Keep last incomplete line in buffer
    // 4. Process complete lines:
    //    - First line: extract headers
    //    - Other lines: create objects with headers as keys
    // 5. Push objects to next stream

    this.buffer += chunk.toString();
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      this.lineNumber++;

      const values = line.split(",");
      if (!this.headers) {
        this.headers = values.map((h) => h.trim());
      } else {
        const record = {};
        this.headers.forEach(
          (key, i) => (record[key] = values[i]?.trim() || "")
        );
        this.push(record);
      }
    }
    callback();
  }

  _flush(callback) {
    // TODO: Process any remaining data in buffer

    if (this.buffer.trim() && this.headers) {
      this.lineNumber++;
      const values = this.buffer.split(",");
      const record = {};
      this.headers.forEach((key, i) => (record[key] = values[i]?.trim() || ""));
      this.push(record);
    }
    callback();
  }
}

/**
 * Data Transformer Stream
 * Applies transformations to each record
 */
class DataTransformer extends Transform {
  constructor(options = {}) {
    super({ objectMode: true });
  }

  _transform(record, encoding, callback) {
    // TODO: Apply transformations to record
    // 1. Capitalize name using capitalizeName()
    // 2. Normalize email using normalizeEmail()
    // 3. Format phone using formatPhone()
    // 4. Standardize date using standardizeDate()
    // 5. Capitalize city name
    // 6. Push transformed record

    try {
      record.name = capitalizeName(record.name);
      record.email = normalizeEmail(record.email);
      record.phone = formatPhone(record.phone);
      record.birthdate = standardizeDate(record.birthdate);
      record.city = capitalizeName(record.city);
      this.push(record);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

/**
 * CSV Writer Transform Stream
 * Converts objects back to CSV format
 */
class CSVWriter extends Transform {
  constructor(options = {}) {
    super({ objectMode: true });
    // TODO: Initialize properties
    // - this.headerWritten = false;

    this.headerWritten = false;
    this.headers = [];
  }

  _transform(record, encoding, callback) {
    // TODO: Convert object to CSV format
    // 1. Write headers on first record
    // 2. Convert record values to CSV line
    // 3. Handle special characters and quotes
    // 4. Push CSV line as string

    if (!this.headerWritten) {
      this.headers = Object.keys(record);
      this.push(this.headers.join(",") + "\n");
      this.headerWritten = true;
    }

    const line = this.headers
      .map((key) => {
        const value = record[key] ?? "";
        return value.includes(",") ? `"${value}"` : value;
      })
      .join(",");
    this.push(line + "\n");
    callback();
  }
}

/**
 * Helper Functions
 */

/**
 * Capitalize names properly
 * @param {string} name - Name to capitalize
 * @returns {string} Capitalized name
 */
function capitalizeName(name) {
  // TODO: Implement name capitalization
  // 1. Handle empty/null names
  // 2. Split by spaces and hyphens
  // 3. Capitalize each part
  // 4. Join back together
  // Examples:
  // "john doe" → "John Doe"
  // "mary-jane smith" → "Mary-Jane Smith"

  if (!name) return "";
  return name
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map(
          (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join("-")
    )
    .join(" ");
}

/**
 * Normalize email addresses
 * @param {string} email - Email to normalize
 * @returns {string} Normalized email or original if invalid
 */
function normalizeEmail(email) {
  // TODO: Implement email normalization
  // 1. Convert to lowercase
  // 2. Validate basic email format (contains @ and .)
  // 3. Return normalized email or original if invalid

  if (!email) return "";
  const lower = email.toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return valid.test(lower) ? lower : email;
}

/**
 * Format phone numbers
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone or "INVALID"
 */
function formatPhone(phone) {
  // TODO: Implement phone formatting
  // 1. Extract only digits
  // 2. Check if exactly 10 digits
  // 3. Format as (XXX) XXX-XXXX
  // 4. Return "INVALID" if not valid

  if (!phone) return "INVALID";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10)
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return "INVALID";
}

/**
 * Standardize date formats
 * @param {string} date - Date to standardize
 * @returns {string} Date in YYYY-MM-DD format
 */
function standardizeDate(date) {
  // TODO: Implement date standardization
  // 1. Handle different input formats:
  //    - MM/DD/YYYY
  //    - YYYY-MM-DD
  //    - YYYY/MM/DD
  // 2. Convert to YYYY-MM-DD format
  // 3. Validate date is real
  // 4. Return original if invalid

  if (!date) return "";
  let d = new Date(date);
  if (isNaN(d)) {
    const parts = date.split(/[\/\-]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        d = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
      }
    }
  }
  if (isNaN(d)) return date;
  return d.toISOString().split("T")[0];
}

/**
 * Main function to process CSV file
 * @param {string} inputPath - Path to input CSV file
 * @param {string} outputPath - Path to output CSV file
 * @returns {Promise} Promise that resolves when processing is complete
 */
async function processCSVFile(inputPath, outputPath) {
  // TODO: Implement the main processing pipeline
  // 1. Create read stream from input file
  // 2. Create transform streams (CSVParser, DataTransformer, CSVWriter)
  // 3. Create write stream to output file
  // 4. Use pipeline() to connect all streams
  // 5. Handle errors appropriately
  // 6. Return promise that resolves when complete

  try {
    await pipeline(
      fs.createReadStream(inputPath),
      new CSVParser(),
      new DataTransformer(),
      new CSVWriter(),
      fs.createWriteStream(outputPath)
    );
    console.log("CSV transformation completed successfully!");
  } catch (error) {
    throw new Error(`Failed to process CSV file: ${error.message}`);
  }
}

/**
 * Create sample input data for testing
 */
function createSampleData() {
  // TODO: Create data directory and sample CSV file
  // 1. Create 'data' directory if it doesn't exist
  // 2. Write sample CSV data as specified in task description

  const dir = path.join(__dirname, "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const csv = `name,email,phone,birthdate,city
john doe,JOHN.DOE@EXAMPLE.COM,1234567890,12/25/1990,new york
jane smith,Jane.Smith@Gmail.Com,555-123-4567,1985-03-15,los angeles
bob johnson,BOB@TEST.COM,invalid-phone,03/22/1992,chicago
alice brown,alice.brown@company.org,9876543210,1988/07/04,houstonn`;

  fs.writeFileSync(path.join(dir, "users.csv"), csv, "utf-8");
  console.log("Sample CSV file created: data/users.csv");
}

// Export classes and functions
module.exports = {
  CSVParser,
  DataTransformer,
  CSVWriter,
  processCSVFile,
  capitalizeName,
  normalizeEmail,
  formatPhone,
  standardizeDate,
  createSampleData,
};
//
// Example usage (for testing):
const isReadyToTest = true;

if (isReadyToTest) {
  // Create sample data
  createSampleData();

  // Process the file
  processCSVFile("data/users.csv", "data/users_transformed.csv")
    .then(() => {
      console.log("✅ File transformation completed successfully!");

      // Read and display results
      const output = fs.readFileSync("data/users_transformed.csv", "utf-8");
      console.log("\n📄 Transformed CSV output:");
      console.log(output);
    })
    .catch((error) => {
      console.error("❌ Error processing file:", error.message);
    });
}

