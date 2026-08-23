const { PermissionFlagsBits } = require("discord.js");

const PERMISSIONS = {
    ADMINISTRATOR: PermissionFlagsBits.Administrator,

    SEND_MESSAGES: PermissionFlagsBits.SendMessages,
    EMBED_LINKS: PermissionFlagsBits.EmbedLinks,
    ATTACH_FILES: PermissionFlagsBits.AttachFiles,

    MANAGE_MESSAGES: PermissionFlagsBits.ManageMessages,
    MANAGE_GUILD: PermissionFlagsBits.ManageGuild,
    KICK_MEMBERS: PermissionFlagsBits.KickMembers,
    BAN_MEMBERS: PermissionFlagsBits.BanMembers,
};

module.exports = {
    PERMISSIONS
};