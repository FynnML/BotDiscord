const { SlashCommandBuilder } = require("discord.js");
const { PERMISSIONS } = require("../config/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("permissions-test")
        .setDescription("Kiểm tra hệ thống permission"),

    meta: {
        category: "utility",
        cooldown: 5,
        guildOnly: true,
    },

    permissions: {
        user: [
            PERMISSIONS.MANAGE_MESSAGES
        ],

        bot: [
            PERMISSIONS.SEND_MESSAGES
        ],
    },

    async execute(interaction) {
        await interaction.reply(
            "✅ User và bot đều có permission cần thiết."
        );
    },
};