// events/guildMemberAdd.js
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger.js");
const config = require("../config");
const { createWelcomeCard } = require("../utils/Canvas");

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
 * Kiểm tra xem bot có đủ quyền trong kênh không
 */
function hasRequiredPermissions(channel, guild) {
  const permissions = channel.permissionsFor(guild.members.me);
  // Bot cần có đủ cả 3 quyền này
  return permissions?.has(["ViewChannel", "SendMessages", "AttachFiles"]);
}

/**
 * Tạo nội dung tin nhắn chào mừng (Chỉ ảnh, nếu lỗi thì dùng Embed)
 */
async function createWelcomeMessage(member) {
  try {
    // Cố gắng tạo thẻ chào mừng bằng Canvas
    const cardBuffer = await createWelcomeCard(member);
    const attachment = new AttachmentBuilder(cardBuffer, { name: "welcome_card.png" });
    
    // Thành công: Chỉ gửi hình ảnh
    return { files: [attachment] };
  } catch (error) {
    logger.warn(`Không thể tạo ảnh chào mừng bằng Canvas: ${error.message}. Đang dùng Embed dự phòng.`);
    
    // Thất bại (Fallback): Gửi Embed dạng text như thiết kế cũ
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle("🎉 Chào mừng thành viên mới!")
      .setDescription(`Xin chào ${member}, chúc bạn có khoảng thời gian vui vẻ tại **${member.guild.name}**!`)
      .setThumbnail(member.user.displayAvatarURL({ extension: "png", size: 1024 }))
      .addFields(
        { name: "👤 Member", value: member.user.tag, inline: true },
        { name: "👥 Members", value: `${member.guild.memberCount}`, inline: true }
      )
      .setImage("attachment://welcome_bg.png")
      .setFooter({
        text: `Chúc ${member.user.tag} có trải nghiệm tuyệt vời!`,
        iconURL: member.guild.iconURL(),
      })
      .setTimestamp();

    return { embeds: [embed] };
  }
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

      if (!hasRequiredPermissions(channel, member.guild)) {
        return logger.warn(`Bot thiếu quyền gửi tin nhắn/đính kèm/xem kênh tại ${channel.name}`);
      }

      const messagePayload = await createWelcomeMessage(member);
      await channel.send(messagePayload);

      logger.success(`Đã chào mừng ${member.user.tag} tại ${member.guild.name}`);
    } catch (error) {
      logger.error(`Lỗi guildMemberAdd: ${error.message}`);
    }
  },
};