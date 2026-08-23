// src/handlers/commandHandler.js
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger.js");
const { DEFAULT_COMMAND_META } = require("../config/commandDefaults");

/**
 * Kiểm tra cấu trúc của lệnh xem có đầy đủ `data` và `execute` không
 */
function isValidCommand(command) {
    return command && command.data && typeof command.execute === "function";
}

/**
 * Lấy danh sách đường dẫn tất cả các file lệnh (.js)
 */
function getCommandFiles() {
    const commandsPath = path.join(__dirname, "..", "commands");

    // Đảm bảo thư mục tồn tại trước khi đọc
    if (!fs.existsSync(commandsPath)) {
        logger.warn(`Thư mục commands không tồn tại tại: ${commandsPath}`);
        return [];
    }

    return fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"))
        .map(file => path.join(commandsPath, file));
}

/**
 * Hàm chính: Đọc file và nạp các lệnh vào bộ nhớ của bot (client)
 */
function loadCommands(client) {
    // Khởi tạo Collection (Map) để lưu trữ các lệnh
    client.commands = new Map();

    const commandFiles = getCommandFiles();

    for (const filePath of commandFiles) {
        const command = require(filePath);
        const fileName = path.basename(filePath);

        // Kiểm tra tính hợp lệ trước khi load
        if (!isValidCommand(command)) {
            logger.warn(`Invalid command (missing data or execute): ${fileName}`);
            continue;
        }

        // Gộp commandDefaults với meta của command
        command.meta = {
        ...DEFAULT_COMMAND_META,
        ...(command.meta || {}),
    };

        // Lưu lệnh vào map với key là tên lệnh
        client.commands.set(command.data.name, command);
        logger.success(`Loaded command: /${command.data.name}`);
    }

    logger.info(`Done! Loaded ${client.commands.size} command(s).`);
}

module.exports = {
    loadCommands
};