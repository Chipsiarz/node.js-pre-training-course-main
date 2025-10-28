const fs = require("fs");
const { Transform } = require("stream");
const { pipeline } = require("stream/promises");
const path = require("path");

//Bonus 2: CSVParser and CSVWriter have { delimiter } option
class CSVParser extends Transform {
  constructor({ delimiter = "," } = {}) {
    super({ objectMode: true });
    // TODO: Initialize properties
    // - this.headers = null;
    // - this.lineNumber = 0;
    // - this.buffer = '';

    this.headers = null;
    this.delimiter = delimiter;
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
      const rawLine = line;
      this.lineNumber++;
      const values = line.split(this.delimiter).map((v) => v.trim());

      if (!this.headers) {
        this.headers = values;
        this.emit("headers", { headers: this.headers });
      } else {
        if (values.length !== this.headers.length) {
          this.emit("malformed", {
            line: this.lineNumber,
            raw: rawLine,
            expected: this.headers.length,
            actual: values.length,
          });
          continue;
        }
        const record = {};
        this.headers.forEach((key, i) => (record[key] = values[i] ?? ""));
        record.lineNumber = this.lineNumber;
        this.push(record);
      }

      this.emit("progress", { lines: this.lineNumber });
    }
    callback();
  }

  _flush(callback) {
    // TODO: Process any remaining data in buffer

    if (this.buffer.trim()) {
      const rawLine = this.buffer;
      const values = this.buffer.split(this.delimiter).map((v) => v.trim());
      if (!this.headers) {
        this.headers = values;
        this.emit("headers", { headers: this.headers });
      } else {
        if (values.length !== this.headers.length) {
          this.emit("malformed", {
            line: this.lineNumber + 1,
            raw: rawLine,
            expected: this.headers.length,
            actual: values.length,
          });
        } else {
          this.lineNumber++;
          const record = {};
          this.headers.forEach((key, i) => (record[key] = values[i] ?? ""));
          record.lineNumber = this.lineNumber;
          this.push(record);
        }
      }
    }
    callback();
  }
}

/**
 * Data Transformer Stream
 * Applies transformations to each record
 */
class DataTransformer extends Transform {
  //Bonus 5: Support for multiple transformation rules
  constructor({ rules } = {}) {
    super({ objectMode: true });
    this.rules = Object.keys(rules || {}).length
      ? rules
      : {
          capitalizeName: true,
          normalizeEmail: true,
          formatPhone: true,
          standardizeDate: true,
          capitalizeCity: true,
        };
    this.errors = [];
  }

  _transform(record, encoding, callback) {
    // TODO: Apply transformations to record
    // 1. Capitalize name using capitalizeName()
    // 2. Normalize email using normalizeEmail()
    // 3. Format phone using formatPhone()
    // 4. Standardize date using standardizeDate()
    // 5. Capitalize city name
    // 6. Push transformed record

    //Bonus 3: Data validation with detailed error reporting
    try {
      if (this.rules.capitalizeName && record.name) {
        record.name = capitalizeName(record.name);
      }

      if (this.rules.normalizeEmail && record.email) {
        const validEmail = normalizeEmail(record.email);
        if (!validEmail) {
          const errObj = {
            type: "validation",
            line: record.lineNumber,
            field: "email",
            value: record.email,
            message: "Invalid email format",
          };
          this.errors.push(errObj);
          this.emit("validation-error", errObj);
          record.email = "INVALID";
        } else {
          record.email = validEmail;
        }
      }

      if (this.rules.formatPhone && record.phone) {
        const formatted = formatPhone(record.phone);
        if (formatted === "INVALID") {
          const errObj = {
            type: "validation",
            line: record.lineNumber,
            field: "phone",
            value: record.phone,
            message: "Invalid phone number",
          };
          this.errors.push(errObj);
          this.emit("validation-error", errObj);
        }
        record.phone = formatted;
      }

      if (this.rules.standardizeDate && record.birthdate) {
        const stdDate = standardizeDate(record.birthdate);
        if (stdDate === record.birthdate) {
          const errObj = {
            type: "validation",
            line: record.lineNumber,
            field: "birthdate",
            value: record.birthdate,
            message: "Unrecognized date format",
          };
          this.errors.push(errObj);
          this.emit("validation-error", errObj);
        }
        record.birthdate = stdDate;
      }

      if (this.rules.capitalizeCity && record.city) {
        record.city = capitalizeName(record.city);
      }

      this.push(record);
      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    if (this.errors.length > 0) {
      this.emit("validation-summary", { errors: this.errors.slice() });
    }
    callback();
  }
}

/**
 * CSV Writer Transform Stream
 * Converts objects back to CSV format
 */
class CSVWriter extends Transform {
  constructor({ delimiter = "," } = {}) {
    super({ objectMode: true });
    // TODO: Initialize properties
    // - this.headerWritten = false;

    this.headerWritten = false;
    this.headers = [];
    this.delimiter = delimiter;
  }

  _transform(record, encoding, callback) {
    // TODO: Convert object to CSV format
    // 1. Write headers on first record
    // 2. Convert record values to CSV line
    // 3. Handle special characters and quotes
    // 4. Push CSV line as string

    if (!this.headerWritten) {
      this.headers = Object.keys(record).filter((key) => key !== "lineNumber");
      this.push(this.headers.join(this.delimiter) + "\n");
      this.headerWritten = true;
    }

    const line = this.headers
      .map((key) => {
        const value = record[key] ?? "";
        const strValue = String(value);
        return strValue.includes(this.delimiter) ? `"${strValue}"` : strValue;
      })
      .join(this.delimiter);
    this.push(line + "\n");
    callback();
  }
}

//Bonus 6: Json to CSV converter

class JSONtoCSV extends Transform {
  constructor({ delimiter = "," } = {}) {
    super({ objectMode: true });
    this.csvWriter = new CSVWriter({ delimiter });
  }

  _transform(record, encoding, callback) {
    this.csvWriter._transform(record, encoding, callback);
    callback();
  }

  _flush(callback) {
    this.csvWriter._flush(() => {
      callback();
    });
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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower) ? lower : email;
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

  const parts = date.split(/[\/\-]/).map((p) => p.trim());
  if (parts.length !== 3) return date;

  const toInt = (s) => {
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : NaN;
  };

  if (parts[2].length === 4) {
    const mm = toInt(parts[0]);
    const dd = toInt(parts[1]);
    const yyyy = toInt(parts[2]);
    if (
      !Number.isFinite(mm) ||
      !Number.isFinite(dd) ||
      !Number.isFinite(yyyy)
    ) {
      return date;
    }
    if (mm < 1 || mm > 12) return date;

    const daysInMonth = (y, m) => {
      return new Date(y, m, 0).getDate();
    };
    if (dd < 1 || dd > daysInMonth(yyyy, mm)) return date;

    const month = String(mm).padStart(2, "0");
    const day = String(dd).padStart(2, "0");
    return `${yyyy}-${month}-${day}`;
  }

  if (parts[0].length === 4) {
    const yyyy = toInt(parts[0]);
    const mm = toInt(parts[1]);
    const dd = toInt(parts[2]);
    if (
      !Number.isFinite(mm) ||
      !Number.isFinite(dd) ||
      !Number.isFinite(yyyy)
    ) {
      return date;
    }
    if (mm < 1 || mm > 12) return date;
    const daysInMonth = (y, m) => new Date(y, m, 0).getDate();
    if (dd < 1 || dd > daysInMonth(yyyy, mm)) return date;

    const month = String(mm).padStart(2, "0");
    const day = String(dd).padStart(2, "0");
    return `${yyyy}-${month}-${day}`;
  }

  return date;
}

/**
 * Main function to process CSV file
 * @param {string} inputPath - Path to input CSV file
 * @param {string} outputPath - Path to output CSV file
 * @returns {Promise} Promise that resolves when processing is complete
 */
async function processCSVFile(inputPath, outputPath, options = {}) {
  // TODO: Implement the main processing pipeline
  // 1. Create read stream from input file
  // 2. Create transform streams (CSVParser, DataTransformer, CSVWriter)
  // 3. Create write stream to output file
  // 4. Use pipeline() to connect all streams
  // 5. Handle errors appropriately
  // 6. Return promise that resolves when complete

  const { delimiter = ",", rules = {} } = options;

  if (!fs.existsSync(inputPath)) {
    throw new Error(
      `Failed to process CSV file: input file not found: ${inputPath}`
    );
  }

  try {
    await pipeline(
      fs.createReadStream(inputPath),
      new CSVParser({ delimiter }),
      new DataTransformer({ rules }),
      new CSVWriter({ delimiter }),
      fs.createWriteStream(outputPath)
    );
    console.log("CSV file transformed successfully!");
  } catch (err) {
    throw new Error(
      `Failed to process CSV file: ${
        err && err.message ? err.message : String(err)
      }`
    );
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

  const filePath = path.join(dir, "users.csv");

  if (fs.existsSync(filePath)) {
    console.log("Sample CSV already exists: data/users.csv");
    return;
  }

  const csv = `name,email,phone,birthdate,city
john doe,JOHN.DOE@EXAMPLE.COM,1234567890,12/25/1990,new york
jane smith,Jane.Smith@Gmail.Com,555-123-4567,1985-03-15,los angeles
bob johnson,BOB@TEST.COM,invalid-phone,03/22/1992,chicago
alice brown,alice.brown@company.org,9876543210,1988/07/04,houstonn
`;

  fs.writeFileSync(filePath, csv, "utf-8");
  console.log("Sample CSV file created: data/users.csv");
}

//Bonus 4: CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Usage: node task-02.js <input.csv> <output.csv>");
    process.exit(1);
  }
  const [inputPath, outputPath] = args;

  processCSVFile(inputPath, outputPath, {
    rules: {
      capitalizeName: true,
      normalizeEmail: true,
      formatPhone: true,
      standardizeDate: true,
      capitalizeCity: true,
    },
  }).catch(() => process.exit(1));
}

// Export classes and functions
module.exports = {
  CSVParser,
  DataTransformer,
  CSVWriter,
  JSONtoCSV,
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

