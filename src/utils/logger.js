// utils/logger.js

const fs = require("fs");
const path = require("path");
const { DateTime } = require("luxon");
const chalk = require("chalk");
const util = require("util");

// ==================== Constants ====================

const LOGS_DIR = path.join(__dirname, "..", "..", "logs");
const LOG_FILE = path.join(LOGS_DIR, "latest.log");
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_ARCHIVES = 5;

let fileLoggingEnabled = true;
let logStream = null;
let currentLogSize = 0;
let isRotating = false;
let pendingQueue = [];

// ==================== File Logging & Rotation ====================

function disableFileLogging(reason) {
  if (!fileLoggingEnabled) return;
  fileLoggingEnabled = false;
  // Dùng console.error trực tiếp để tránh vòng lặp đệ quy gọi logger
  console.error(`[LOGGER WARNING] Vô hiệu hóa ghi log ra file: ${reason}`);
  if (logStream) {
    try {
      logStream.removeAllListeners("error");
      logStream.end();
    } catch (_) {}
    logStream = null;
  }
}

function ensureLogDir() {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
    return true;
  } catch (err) {
    disableFileLogging(`Không thể tạo thư mục logs (${LOGS_DIR}): ${err.message}`);
    return false;
  }
}

function initStream() {
  if (!fileLoggingEnabled) return;
  if (!ensureLogDir()) return;

  try {
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      currentLogSize = stats.size;
    } else {
      currentLogSize = 0;
    }

    logStream = fs.createWriteStream(LOG_FILE, { flags: "a" });
    logStream.on("error", (err) => {
      disableFileLogging(`Lỗi stream ghi log: ${err.message}`);
    });
  } catch (err) {
    disableFileLogging(`Không thể mở file log: ${err.message}`);
  }
}

// Khởi tạo stream an toàn khi nạp module
initStream();

function pruneArchives() {
  try {
    if (!fs.existsSync(LOGS_DIR)) return;
    const files = fs.readdirSync(LOGS_DIR);
    const archives = files
      .filter((file) => file.startsWith("latest-") && file.endsWith(".log"))
      .map((file) => {
        const filePath = path.join(LOGS_DIR, file);
        let mtime = 0;
        try {
          mtime = fs.statSync(filePath).mtimeMs;
        } catch (_) {}
        return { file, path: filePath, mtime };
      })
      .sort((a, b) => b.mtime - a.mtime); // Mới nhất lên đầu

    if (archives.length > MAX_ARCHIVES) {
      const toDelete = archives.slice(MAX_ARCHIVES);
      for (const item of toDelete) {
        try {
          fs.unlinkSync(item.path);
        } catch (_) {}
      }
    }
  } catch (err) {
    // Không ném lỗi nếu việc dọn dẹp gặp trục trặc
  }
}

function performRotation() {
  try {
    logStream = null;
    if (fs.existsSync(LOG_FILE)) {
      const timestamp = DateTime.now().setZone("Asia/Ho_Chi_Minh").toFormat("yyyy-MM-dd-HHmmss");
      let archiveName = `latest-${timestamp}.log`;
      let archivePath = path.join(LOGS_DIR, archiveName);
      let counter = 1;
      while (fs.existsSync(archivePath)) {
        archiveName = `latest-${timestamp}-${counter}.log`;
        archivePath = path.join(LOGS_DIR, archiveName);
        counter++;
      }
      fs.renameSync(LOG_FILE, archivePath);
    }
    pruneArchives();
    currentLogSize = 0;
    initStream();
  } catch (err) {
    disableFileLogging(`Xoay vòng file log thất bại: ${err.message}`);
  } finally {
    isRotating = false;
    // Ghi các dòng đang chờ trong hàng đợi vào stream mới
    if (fileLoggingEnabled && logStream && !logStream.writableEnded) {
      while (pendingQueue.length > 0) {
        const item = pendingQueue.shift();
        try {
          logStream.write(item.line);
          currentLogSize += item.bytes;
        } catch (err) {
          disableFileLogging(`Ghi file log thất bại sau khi xoay vòng: ${err.message}`);
          break;
        }
      }
    }
    pendingQueue = [];
  }
}

function rotateAndWrite(line, bytes) {
  isRotating = true;
  pendingQueue.push({ line, bytes });

  if (!logStream || logStream.writableEnded) {
    performRotation();
    return;
  }

  logStream.end(() => {
    performRotation();
  });
}

function writeToFile(text) {
  if (!fileLoggingEnabled) return;
  const line = text + "\n";
  const bytes = Buffer.byteLength(line, "utf8");

  if (isRotating) {
    pendingQueue.push({ line, bytes });
    return;
  }

  if (currentLogSize + bytes >= MAX_LOG_SIZE) {
    rotateAndWrite(line, bytes);
  } else {
    try {
      if (logStream && !logStream.writableEnded) {
        logStream.write(line);
        currentLogSize += bytes;
      }
    } catch (err) {
      disableFileLogging(`Ghi file log thất bại: ${err.message}`);
    }
  }
}

/**
 * Đợi và xả toàn bộ dữ liệu log đang chờ ghi xuống đĩa trước khi thoát tiến trình
 * @returns {Promise<void>}
 */
async function flush() {
  if (!fileLoggingEnabled || !logStream) return;
  return new Promise((resolve) => {
    const checkReady = () => {
      if (isRotating) {
        setTimeout(checkReady, 20);
        return;
      }
      if (!logStream || logStream.writableEnded) {
        return resolve();
      }
      logStream.end(() => {
        resolve();
      });
    };
    checkReady();
    // Giới hạn thời gian tối đa 1 giây để không treo tiến trình
    setTimeout(resolve, 1000).unref();
  });
}

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

/**
 * Tạo hàm log cho một level cụ thể.
 * @param {Object} config - Cấu hình của level (label, color)
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

module.exports = Object.freeze(
  Object.assign({ LOG_LEVELS, flush, MAX_LOG_SIZE, MAX_ARCHIVES }, loggerMethods)
);