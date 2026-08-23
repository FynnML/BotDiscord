const logger = require("../utils/logger.js");
const { checkPermissions, checkGuildOnly } = require("../utils/permissionChecker.js");
const { getRemainingCooldown, setCooldown } = require("../utils/cooldownManager.js");

/**
 * Xử lý sự kiện khi có một interaction mới (ví dụ: slash command).
 */
module.exports = {
    name: "interactionCreate",

    /**
     * @param {import('discord.js').Interaction} interaction
     */
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const { commandName, client, user } = interaction;
        const command = client.commands.get(commandName);

        if (!command) {
            logger.warn(`Không tìm thấy command: /${commandName}`);
            return;
        }
        
        // Kiểm tra lệnh có giới hạn chỉ dùng trong server không
        if (!(await checkGuildOnly(interaction, command.meta?.guildOnly))) return;

        // Kiểm tra quyền của bot và user
        if (!(await checkPermissions(interaction, command.permissions))) return;

        // Xử lý thời gian hồi chiêu (cooldown)
        const cooldownSeconds = command.meta?.cooldown ?? 0;
        const remaining = getRemainingCooldown(commandName, user.id, cooldownSeconds);

        if (remaining > 0) {
            const seconds = Math.ceil(remaining / 1000);

            await interaction.reply({
                content: `⏳ Vui lòng chờ **${seconds}s** trước khi sử dụng \`/${commandName}\` lại.`,
                ephemeral: true,
            });

            logger.warn(`${user.tag} đang cooldown /${commandName}`);
            return;
        }

        setCooldown(commandName, user.id);

        // Thực thi lệnh
        try {
            await command.execute(interaction);
            logger.success(`/${commandName} được sử dụng bởi ${user.tag}`);
        } catch (error) {
            logger.error(`Lỗi /${commandName}: ${error.stack || error.message}`);

            try {
                const response = { content: "Đã xảy ra lỗi khi thực hiện command.", ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(response);
                } else {
                    await interaction.reply(response);
                }
            } catch (replyError) {
                logger.error(`Không thể gửi error response: ${replyError.message}`);
            }
        }
    }
};