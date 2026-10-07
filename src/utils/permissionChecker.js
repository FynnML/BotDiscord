const { PermissionsBitField } = require("discord.js");
const logger = require("./logger.js");

/**
 * Lấy danh sách tên quyền còn thiếu từ PermissionsBitField.
 * @param {import('discord.js').PermissionsBitField|null} resolvedPermissions
 * @param {bigint[]} requiredList
 * @returns {string[]}
 */
function getMissingPermissions(resolvedPermissions, requiredList = []) {
    if (!requiredList.length || !resolvedPermissions) return [];
    const missing = [];
    for (const perm of requiredList) {
        if (!resolvedPermissions.has(perm)) {
            const name = new PermissionsBitField(perm).toArray()[0] || perm.toString();
            missing.push(name);
        }
    }
    return missing;
}

/**
 * Kiểm tra xem member hoặc resolved permissions có tất cả các quyền được yêu cầu hay không.
 * @param {import('discord.js').GuildMember|import('discord.js').PermissionsBitField} memberOrPermissions
 * @param {bigint[]} [permissions=[]] - Danh sách quyền
 * @returns {boolean} True nếu có đủ quyền hoặc danh sách quyền trống
 */
function hasPermissions(memberOrPermissions, permissions = []) {
    if (!permissions.length) return true;
    const perms = memberOrPermissions?.permissions || memberOrPermissions;
    if (!perms || typeof perms.has !== "function") return false;
    return permissions.every(permission => perms.has(permission));
}

/**
 * Resolve permissions cho member dựa vào interaction.channel (tính cả channel overwrites).
 * Nếu không có channel hoặc không có permissionsFor thì fallback về member.permissions.
 * @param {import('discord.js').CommandInteraction} interaction
 * @param {import('discord.js').GuildMember} member
 * @returns {import('discord.js').PermissionsBitField|null}
 */
function resolvePermissions(interaction, member) {
    if (!member) return null;
    if (interaction.channel && typeof interaction.channel.permissionsFor === "function") {
        return interaction.channel.permissionsFor(member);
    }
    return member.permissions ?? null;
}

/**
 * Kiểm tra quyền của người dùng và bot trước khi thực thi lệnh.
 * Bỏ qua kiểm tra nếu lệnh được sử dụng trong DM (không có guild).
 * Tôn trọng channel permission overwrites bằng cách resolve quyền theo interaction.channel.
 * @param {import('discord.js').CommandInteraction} interaction - Interaction từ Discord
 * @param {Object} [permissions={}] - Cấu hình quyền yêu cầu
 * @param {bigint[]} [permissions.user] - Quyền cần thiết cho người dùng
 * @param {bigint[]} [permissions.bot] - Quyền cần thiết cho bot
 * @returns {Promise<boolean>} True nếu thỏa mãn tất cả quyền
 */
async function checkPermissions(interaction, permissions = {}) {
    const userPermissions = permissions?.user ?? [];
    const botPermissions = permissions?.bot ?? [];

    // Bỏ qua kiểm tra quyền guild nếu tương tác diễn ra trong DM
    if (!interaction.guild) return true;

    const member = interaction.member;
    const botMember = interaction.guild.members.me;

    if (!botMember) {
        logger.error(`Không thể lấy bot member tại guild ${interaction.guild.name} (${interaction.guild.id})`);
        return false;
    }

    const userPerms = resolvePermissions(interaction, member);
    const missingUser = getMissingPermissions(userPerms, userPermissions);
    if (missingUser.length > 0) {
        await interaction.reply({
            content: "❌ Bạn không có quyền sử dụng command này.",
            ephemeral: true,
        });
        logger.warn(
            `User ${interaction.user.tag} thiếu quyền [${missingUser.join(", ")}] khi dùng /${interaction.commandName} tại guild ${interaction.guild.name}`
        );
        return false;
    }

    const botPerms = resolvePermissions(interaction, botMember);
    const missingBot = getMissingPermissions(botPerms, botPermissions);
    if (missingBot.length > 0) {
        await interaction.reply({
            content: "❌ Bot không có đủ quyền để thực hiện command này.",
            ephemeral: true,
        });
        logger.warn(
            `Bot thiếu quyền [${missingBot.join(", ")}] khi thực hiện /${interaction.commandName} tại guild ${interaction.guild.name}`
        );
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
    getMissingPermissions,
    resolvePermissions,
};