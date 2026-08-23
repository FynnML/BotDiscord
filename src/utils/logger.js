// utils/logger.js

const fs = require("fs");
const path = require("path");
const { DateTime } = require("luxon");
const chalk = require("chalk");
const util = require("util");

// ==================== Constants ====================

const LOGS_DIR = path.join(__dirname, "..", "..", "logs");
const LOG_FILE = path.join(LOGS_DIR, "latest.log");

// Đảm bảo thư mục logs tồn tại trước khi tạo stream
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Tạo write stream để ghi log bất đồng bộ
const logStream = fs.createWriteStream(LOG_FILE, { flags: "a" });

const LOG_LEVELS = Object.freeze({
  info:    { label: "INFO",    color: chalk.blue.bold},
  success: { label: "SUCCESS", color: chalk.green.bold},
  warn:    { label: "WARN",    color: chalk.yellow.bold},
  error:   { label: "ERROR",   color: chalk.red.bold},
  debug:   { label: "DEBUG",   color: chalk.magenta.bold},
});

// ==================== Helpers ====================

function getTimestamp() {
  return DateTime.now()
    .setZone("Asia/Ho_Chi_Minh")
    .toFormat("MMM dd yyyy | hh:mm:ss a");
}

function writeToFile(text) {
  logStream.write(text + "\n");
}

/**
 * Tạo hàm log cho một level cụ thể.
 * @param {Object} config - Cấu hình của level (label, color, icon)
 * @returns {Function}
 */
function createLogger(config) {
  return function log(...args) {
    const { label, color } = config;
    const message = util.format(...args);
    const timestamp = getTimestamp();
    
    // Đệm thêm khoảng trắng để các nhãn dài bằng nhau (SUCCESS là 7 ký tự)
    const paddedLabel = label.padEnd(7, " ");
    
    // Dòng log hiển thị trên console (có màu)
    const consoleTimestamp = chalk.dim(`[${timestamp}]`);
    const consoleLabel = color(`[${paddedLabel}]`);
    const consoleLine = `${consoleTimestamp} ${consoleLabel} ${message}`;
    
    // Dòng log ghi vào file (không có ANSI escape codes)
    const fileLine = `[${timestamp}] [${paddedLabel}] ${message}`;
    
    console.log(consoleLine);
    writeToFile(fileLine);
  };
}

// ==================== Logger Implementation ====================

const loggerMethods = {};
for (const [key, config] of Object.entries(LOG_LEVELS)) {
  loggerMethods[key] = createLogger(config);
}

// ==================== Exports ====================

// Object.assign đảm bảo export cả LOG_LEVELS lẫn các hàm log
module.exports = Object.freeze(
  Object.assign({ LOG_LEVELS }, loggerMethods)
);