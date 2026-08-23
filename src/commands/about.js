// commands/about.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../config");

/**
 * Format milliseconds thành chuỗi ngày, giờ, phút, giây
 */
function formatUptime(uptimeMs) {
    const totalSeconds = Math.floor(uptimeMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("about")
        .setDescription("Hiển thị thông tin chi tiết về bot (phiên bản, uptime, ...)."),

    meta: {
        category: "general",
        cooldown: 10,
        guildOnly: true,
    },

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const { client } = interaction;
        
        // Tính toán thời gian bot đã online
        const uptimeString = formatUptime(client.uptime);

        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(`🤖 Thông tin về ${client.user.username}`)
            .setDescription("Welcome Bot - Quản lý chào mừng thành viên mới.")
            .setThumbnail(client.user.displayAvatarURL({ extension: "png", size: 256 }))
            .addFields(
                { name: "🏷️ Phiên bản", value: config.bot.version, inline: true },
                { name: "🌍 Máy chủ", value: `${client.guilds.cache.size}`, inline: true },
                { name: "⏱️ Uptime", value: uptimeString, inline: true },
                { name: "🕒 Múi giờ", value: config.bot.timezone, inline: true },
                { name: "📶 Ping", value: `${client.ws.ping}ms`, inline: true }
            )
            .setFooter({ text: "Bot By Fynn" })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};