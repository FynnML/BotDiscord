// commands/ping.js
const { SlashCommandBuilder } = require("discord.js");
const { PERMISSIONS } = require("../config/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Kiểm tra bot có đang hoạt động không và xem độ trễ (latency).")
        .setDefaultMemberPermissions(PERMISSIONS.MANAGE_MESSAGES),

    meta: {
        category: "utility",
        cooldown: 3,
        guildOnly: true,
    },

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        // Lấy độ trễ kết nối API (WebSocket ping) của bot
        const latency = interaction.client.ws.ping;

        await interaction.reply({
            content: `🏓 Pong! Độ trễ API là **${latency}ms**.`,
        });
    }
};
