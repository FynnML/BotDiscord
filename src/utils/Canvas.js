// src/utils/Canvas.js
const { createCanvas, loadImage } = require("canvas");
const welcomeConfig = require("../config/welcome");

/**
 * Truncate text with ellipsis if it exceeds maxWidth.
 * Dùng làm lưới an toàn cuối cùng, sau khi fitFontSize đã thử thu nhỏ hết cỡ.
 */
function truncateText(ctx, text, maxWidth) {
    let width = ctx.measureText(text).width;
    if (width <= maxWidth) return text;
    let truncated = text;
    while (width > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
        width = ctx.measureText(truncated + '...').width;
    }
    return truncated + '...';
}

/**
 * Giảm dần cỡ chữ (maxSize -> minSize) tới khi vừa maxWidth.
 * Set sẵn ctx.font theo cỡ tìm được trước khi return, gọi xong là đo/vẽ được luôn.
 */
function fitFontSize(ctx, text, weight, family, maxWidth, maxSize, minSize) {
    let size = maxSize;
    ctx.font = `${weight} ${size}px ${family}`;
    while (size > minSize && ctx.measureText(text).width > maxWidth) {
        size -= 1;
        ctx.font = `${weight} ${size}px ${family}`;
    }
    return size;
}

/**
 * Vẽ path hình chữ nhật bo góc thủ công bằng arcTo (không phụ thuộc ctx.roundRect
 * để tương thích ngược với các bản node-canvas cũ hơn).
 */
function traceRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}

/**
 * Đo chiều cao thực tế từ baseline lên đỉnh chữ (actualBoundingBoxAscent) thay vì
 * đoán theo tỉ lệ fontSize — dùng để canh 2 dòng WELCOME/username chuẩn theo tâm avatar.
 * Lưu ý: cần set ctx.font đúng font muốn đo TRƯỚC khi gọi hàm này.
 */
function measureCapHeight(ctx, sampleText) {
    return ctx.measureText(sampleText).actualBoundingBoxAscent;
}

/**
 * Tạo ảnh thẻ chào mừng cho thành viên mới
 * @param {import("discord.js").GuildMember} member
 * @returns {Promise<Buffer>} Buffer của ảnh PNG
 */
async function createWelcomeCard(member) {
    const { canvas: cvs, background: bg, overlay, avatar: avt, shadow, text } = welcomeConfig;
    const canvas = createCanvas(cvs.width, cvs.height);
    const ctx = canvas.getContext("2d");

    // =========================
    // Background
    // =========================
    const bgImages = bg.images || [bg.imagePath];
    const randomImagePath = bgImages[Math.floor(Math.random() * bgImages.length)];
    const background = await loadImage(randomImagePath);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // =========================
    // Overlay: bo góc (traceRoundedRect + fill trực tiếp trên path vừa vẽ,
    // không cần clip riêng) + gradient trái -> phải, thay vì phủ đen đều sắc cạnh
    // =========================
    const innerX = overlay.margin;
    const innerY = overlay.margin;
    const innerW = canvas.width - overlay.margin * 2;
    const innerH = canvas.height - overlay.margin * 2;

    const overlayGradient = ctx.createLinearGradient(innerX, 0, innerX + innerW, 0);
    overlay.gradient.forEach(stop => overlayGradient.addColorStop(stop.offset, stop.color));
    ctx.fillStyle = overlayGradient;
    traceRoundedRect(ctx, innerX, innerY, innerW, innerH, overlay.radius || 0);
    ctx.fill();

    // =========================
    // Avatar
    // =========================
    let avatarImage = null;
    try {
        const avatarURL = member.user.displayAvatarURL({ extension: "png", size: 256 });
        avatarImage = await loadImage(avatarURL);
    } catch (err) {
        // Fallback handled below
    }

    const avatarRadius = avt.size / 2;
    const avatarCenterX = avt.x + avatarRadius;
    const avatarCenterY = avt.y + avatarRadius;

    // Đổ bóng mềm phía sau avatar để tạo chiều sâu
    ctx.save();
    ctx.shadowColor = avt.shadow.color;
    ctx.shadowBlur = avt.shadow.blur;
    ctx.shadowOffsetX = avt.shadow.offsetX;
    ctx.shadowOffsetY = avt.shadow.offsetY;
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.restore();

    // Draw Avatar (Clipped to circle)
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (avatarImage) {
        ctx.drawImage(avatarImage, avt.x, avt.y, avt.size, avt.size);
    } else {
        // Fallback if avatar fails to load
        ctx.fillStyle = avt.fallbackColor;
        ctx.fillRect(avt.x, avt.y, avt.size, avt.size);

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${avt.size / 2}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(member.user.username.charAt(0).toUpperCase(), avatarCenterX, avatarCenterY);
    }
    ctx.restore();

    // Draw Avatar Border
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
    ctx.strokeStyle = avt.borderColor;
    ctx.lineWidth = avt.borderWidth;
    ctx.stroke();

    // =========================
    // Text
    // =========================
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;

    // --- Username: thử thu nhỏ cỡ chữ trước (fitFontSize), chỉ truncate (...) ---
    // --- nếu đã chạm minSize mà vẫn tràn maxWidth ---
    const uCfg = text.username;
    const usernameRaw = member.user.username.toUpperCase();
    fitFontSize(ctx, usernameRaw, uCfg.weight, uCfg.family, uCfg.maxWidth, uCfg.maxSize, uCfg.minSize);
    const usernameFont = ctx.font; // fitFontSize đã set sẵn font/cỡ chữ phù hợp
    let usernameDisplay = usernameRaw;
    if (ctx.measureText(usernameDisplay).width > uCfg.maxWidth) {
        usernameDisplay = truncateText(ctx, usernameDisplay, uCfg.maxWidth);
    }

    // --- Đo chiều cao thực tế của 2 dòng (thay vì đoán theo fontSize) để canh ---
    // --- khối chữ WELCOME + username theo đúng tâm avatar ---
    ctx.font = text.welcome.font;
    const welcomeCapHeight = measureCapHeight(ctx, "WELCOME");
    ctx.font = usernameFont;
    const usernameCapHeight = measureCapHeight(ctx, usernameDisplay);

    const totalBlockHeight = welcomeCapHeight + text.lineGap + usernameCapHeight;
    const blockTop = text.blockAnchorY - totalBlockHeight / 2;
    const welcomeY = blockTop + welcomeCapHeight;
    const usernameY = welcomeY + text.lineGap + usernameCapHeight;

    // WELCOME
    ctx.font = text.welcome.font;
    ctx.fillStyle = text.welcome.color;
    ctx.textAlign = text.welcome.align;
    ctx.textBaseline = text.welcome.baseline;
    ctx.fillText("WELCOME", text.welcome.x, welcomeY);

    // Username
    ctx.font = usernameFont;
    ctx.fillStyle = uCfg.color;
    ctx.textAlign = uCfg.align;
    ctx.textBaseline = uCfg.baseline;
    ctx.fillText(usernameDisplay, uCfg.x, usernameY);

    // Joined At
    ctx.font = text.joinTime.font;
    ctx.fillStyle = text.joinTime.color;
    ctx.textAlign = text.joinTime.align;
    ctx.textBaseline = text.joinTime.baseline;
    const joinedAt = member.joinedAt || new Date();
    const joinTimeText = truncateText(ctx, `Joined At: ${joinedAt.toLocaleDateString('vi-VN')}`, text.joinTime.maxWidth);
    ctx.fillText(joinTimeText, text.joinTime.x, text.joinTime.y);

    ctx.shadowColor = "transparent";

    return canvas.toBuffer("image/png");
}

module.exports = {
    createWelcomeCard,
};