// src/config/bot.js
const { ActivityType } = require("discord.js");

module.exports = {
  prefix: "/",

  timezone: "Asia/Ho_Chi_Minh",
  activity: {
    // Thông tin trạng thái bot
    name: " /help | Bot By Fynn",
    type: ActivityType.Listening, // Dùng Enum thay cho số tĩnh
  },
  version: "1.0.0",
};