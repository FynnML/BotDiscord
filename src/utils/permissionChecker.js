const logger = require("./logger.js");

/**
 * Kiểm tra xem member có tất cả các quyền được yêu cầu hay không.
 * @param {import('discord.js').GuildMember} member - Thành viên cần kiểm tra
 * @param {bigint[]} [permissions=[]] - Danh sách quyền
 * @returns {boolean} True nếu member có đủ quyền hoặc danh sách quyền trống
 */
function hasPermissions(member, permissions = []) {
    if (!permissions.length) return true;
    return permissions.every(permission => member.permissions.has(permission));
}

/**
 * Kiểm tra quyền của người dùng và bot trước khi thực thi lệnh.
 * Bỏ qua kiểm tra nếu lệnh được sử dụng trong DM (không có guild).
 * @param {import('discord.js').CommandInteraction} interaction - Interaction từ Discord
 * @param {Object} [permissions={}] - Cấu hình quyền yêu cầu
 * @param {bigint[]} [permissions.user] - Quyền cần thiết cho người dùng
 * @param {bigint[]} [permissions.bot] - Quyền cần thiết cho bot
 * @returns {Promise<boolean>} True nếu thỏa mãn tất cả quyền
 */
async function checkPermissions(interaction, permissions = {}) {
    const userPermissions = permissions.user ?? [];
    const botPermissions = permissions.bot ?? [];

    if (!interaction.guild) return true;

    const member = interaction.member;
    const botMember = interaction.guild.members.me;

    if (!botMember) {
        logger.error(`Không thể lấy bot member tại guild ${interaction.guild.id}`);
        return false;
    }

    if (!hasPermissions(member, userPermissions)) {
        await interaction.reply({
            content: "❌ Bạn không có quyền sử dụng command này.",
            ephemeral: true,
        });
        logger.warn(`${interaction.user.tag} không có user permission cho /${interaction.commandName}`);
        return false;
    }

    if (!hasPermissions(botMember, botPermissions)) {
        await interaction.reply({
            content: "❌ Bot không có đủ quyền để thực hiện command này.",
            ephemeral: true,
        });
        logger.warn(`Bot thiếu permission cho /${interaction.commandName} tại ${interaction.guild.name}`);
        return false;
    }

    return true;
}

/**
 * Kiểm tra xem lệnh có bị giới hạn chỉ sử dụng trong server hay không.
 * @param {import('discord.js').CommandInteraction} interaction - Interaction từ Discord
 * @param {boolean} [guildOnly=false] - Lệnh có bắt buộc sử dụng trong server không
 * @returns {Promise<boolean>} True nếu hợp lệ
 */
async function checkGuildOnly(interaction, guildOnly = false) {
    if (!guildOnly || interaction.guild) return true;

    await interaction.reply({
        content: "❌ Command này chỉ có thể sử dụng trong server.",
        ephemeral: true,
    });
    return false;
}

module.exports = {
    hasPermissions,
    checkPermissions,
    checkGuildOnly,
};