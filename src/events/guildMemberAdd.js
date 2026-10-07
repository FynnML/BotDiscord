// events/guildMemberAdd.js
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const logger = require("../utils/logger.js");
const config = require("../config");
const { createWelcomeCard } = require("../utils/Canvas");

/**
 * Danh sách các quyền bắt buộc bot cần có trong kênh chào mừng:
 * - ViewChannel, SendMessages, AttachFiles: Dành cho luồng chính (gửi ảnh Canvas)
 * - EmbedLinks: Dành cho luồng dự phòng (gửi Embed text)
 */
const REQUIRED_PERMISSIONS = ["ViewChannel", "SendMessages", "AttachFiles", "EmbedLinks"];

/**
 * Lấy kênh welcome từ cache hoặc fetch từ API
 */
async function getWelcomeChannel(guild, channelId) {
  let channel = guild.channels.cache.get(channelId);
  if (!channel) {
    try {
      channel = await guild.channels.fetch(channelId);
    } catch (e) {
      return null;
    }
  }
  return channel;
}

/**
 * Kiểm tra các quyền còn thiếu của bot trong kênh chào mừng
 * @param {import("discord.js").GuildChannel} channel
 * @param {import("discord.js").Guild} guild
 * @returns {string[]} Danh sách tên các quyền bị thiếu
 */
function getMissingPermissions(channel, guild) {
  const permissions = channel.permissionsFor(guild.members.me);
  if (!permissions) {
    return REQUIRED_PERMISSIONS;
  }
  return REQUIRED_PERMISSIONS.filter((perm) => !permissions.has(perm));
}

/**
 * Tạo Embed chào mừng dự phòng dạng text (không đính kèm ảnh Canvas)
 * @param {import("discord.js").GuildMember} member
 * @returns {EmbedBuilder}
 */
function buildFallbackEmbed(member) {
  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle("🎉 Chào mừng thành viên mới!")
    .setDescription(`Xin chào ${member}, chúc bạn có khoảng thời gian vui vẻ tại **${member.guild.name}**!`)
    .setThumbnail(member.user.displayAvatarURL({ extension: "png", size: 1024 }))
    .addFields(
      { name: "👤 Member", value: member.user.tag, inline: true },
      { name: "👥 Members", value: `${member.guild.memberCount}`, inline: true }
    )
    .setFooter({
      text: `Chúc ${member.user.tag} có trải nghiệm tuyệt vời!`,
      iconURL: member.guild.iconURL(),
    })
    .setTimestamp();
}

module.exports = {
  name: "guildMemberAdd",

  async execute(member) {
    try {
      const channelId = config.env.welcomeChannelId;
      if (!channelId) {
        return logger.warn("Chưa cấu hình WELCOME_CHANNEL_ID trong .env!");
      }

      const channel = await getWelcomeChannel(member.guild, channelId);
      if (!channel) {
        return logger.warn(`Không tìm thấy welcome channel (ID: ${channelId}) tại ${member.guild.name}`);
      }

      const missingPermissions = getMissingPermissions(channel, member.guild);
      if (missingPermissions.length > 0) {
        return logger.warn(
          `Bot thiếu quyền tại kênh ${channel.name} (${channel.id}): ${missingPermissions.join(", ")}`
        );
      }

      // Primary path: Tạo và gửi ảnh Canvas welcome card
      let sentPrimary = false;
      try {
        const cardBuffer = await createWelcomeCard(member);
        const attachment = new AttachmentBuilder(cardBuffer, { name: "welcome_card.png" });
        await channel.send({ files: [attachment] });
        sentPrimary = true;
        logger.success(`Đã chào mừng ${member.user.tag} tại ${member.guild.name}`);
      } catch (primaryError) {
        logger.warn(
          `Không thể gửi thẻ chào mừng ảnh (${primaryError.message}). Đang chuyển sang gửi Embed dự phòng...`
        );
      }

      // Fallback path: Gửi Embed Text đúng 1 lần nếu luồng chính thất bại
      if (!sentPrimary) {
        try {
          const fallbackEmbed = buildFallbackEmbed(member);
          await channel.send({ embeds: [fallbackEmbed] });
          logger.success(
            `Đã chào mừng ${member.user.tag} tại ${member.guild.name} (bằng Embed dự phòng)`
          );
        } catch (fallbackError) {
          logger.error(
            `Cả phương thức chào mừng chính và dự phòng đều thất bại cho ${member.user.tag} tại ${member.guild.name}: ${fallbackError.message}`
          );
        }
      }
    } catch (error) {
      logger.error(`Lỗi guildMemberAdd: ${error.message}`);
    }
  },
};