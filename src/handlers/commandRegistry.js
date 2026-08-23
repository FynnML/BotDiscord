// src/handlers/commandRegistry.js
const { REST, Routes } = require("discord.js");
const config = require("../config");
const logger = require("../utils/logger.js");

async function registerCommands(client) {
    const commands = [];

    for (const command of client.commands.values()) {
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: "10" }).setToken(config.env.token);

    await rest.put(
        Routes.applicationGuildCommands(
            config.env.clientId,
            config.env.guildId
        ),
        {
            body: commands
        }
    );

    logger.success(
        `Đã đăng ký ${commands.length} command(s) cho server test`
    );
}

module.exports = {
    registerCommands
};