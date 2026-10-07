// index.js
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");

const logger = require("./utils/logger.js");
const validateConfig = require("./config/validate");
const config = require("./config");
const { loadCommands } = require("./handlers/commandHandler");
const { registerCommands } = require("./handlers/commandRegistry");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

loadCommands(client);

// ==================== Global Error Handlers ====================

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason?.stack ?? reason}`);
});

process.on("uncaughtException", async (error) => {
  logger.error(`Uncaught Exception: ${error.stack ?? error.message}`);
  try {
    await logger.flush();
  } finally {
    process.exit(1);
  }
});

// ==================== Graceful Shutdown ====================

process.once("SIGINT", async () => {
  logger.info("Đang tắt bot...");
  client.destroy();
  try {
    await logger.flush();
  } finally {
    process.exit(0);
  }
});

// ==================== Validation ====================

const configErrors = validateConfig();
if (configErrors.length > 0) {
  for (const error of configErrors) {
    logger.error(error);
  }
  logger.error("❌ Configuration không hợp lệ. Bot không thể khởi động.");
  logger.flush().finally(() => {
    process.exit(1);
  });
} else {
  // ==================== Load Events ====================

  const eventsPath = path.join(__dirname, "events");
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    const bind = event.once ? client.once.bind(client) : client.on.bind(client);

    bind(event.name, async (...args) => {
      try {
        await event.execute(...args);
      } catch (error) {
        logger.error(
          `Event ${event.name} error: ${error.stack ?? error.message}`
        );
      }
    });
  }

  client.login(config.env.token).catch(async (error) => {
    logger.error(`Discord login failed: ${error.stack ?? error.message}`);
    client.destroy();
    try {
      await logger.flush();
    } finally {
      process.exit(1);
    }
  });
}
