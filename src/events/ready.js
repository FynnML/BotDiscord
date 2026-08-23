// events/ready.js
const logger = require("../utils/logger.js");
const config = require("../config");
const { registerCommands } = require("../handlers/commandRegistry");

module.exports = {
  name: "clientReady",
  once: true,

  async execute(client) {
    logger.success(`Bot đã đăng nhập: ${client.user.tag}`);
    logger.info(`Đang phục vụ ${client.guilds.cache.size} server(s)`);

    // Set presence (status)
    client.user.setActivity(config.bot.activity.name, {
      type: config.bot.activity.type,
    });

    // Đăng ký lệnh
    await registerCommands(client);
  },
};
