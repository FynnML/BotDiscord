// commands/help.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Hiển thị danh sách các lệnh hiện có của bot."),

    meta: {
        category: "general",
        cooldown: 5,
        guildOnly: true,
    },

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const { commands } = interaction.client;

        // Chuyển Collection commands thành mảng và tạo chuỗi danh sách lệnh
        const commandList = Array.from(commands.values())
            .map(command => { return `**/${command.data.name}** — ${command.data.description} +> Category: ${command.meta.category}` })
            .join("\n");

        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle("📚 Danh Sách Lệnh")
            .setDescription(commandList || "Hiện chưa có lệnh nào được nạp.")
            .setFooter({
                text: `Bot By Fynn • v${config.bot.version}`
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};