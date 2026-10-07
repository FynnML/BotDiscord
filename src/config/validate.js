const config = require("./index");

function isValidSnowflake(value) {
    return typeof value === "string" && /^\d{17,20}$/.test(value.trim());
}

function validateConfig() {
    const errors = [];

    if (!config.env.token) {
        errors.push("Thiếu DISCORD_TOKEN trong file .env");
    }

    if (!config.env.clientId) {
        errors.push("Thiếu CLIENT_ID trong file .env");
    } else if (!isValidSnowflake(config.env.clientId)) {
        errors.push("CLIENT_ID không hợp lệ: phải là Discord Snowflake ID");
    }

    if (!config.env.guildId) {
        errors.push("Thiếu GUILD_ID trong file .env");
    } else if (!isValidSnowflake(config.env.guildId)) {
        errors.push("GUILD_ID không hợp lệ: phải là Discord Snowflake ID");
    }

    if (!config.env.welcomeChannelId) {
        errors.push("Thiếu WELCOME_CHANNEL_ID trong file .env");
    } else if (!isValidSnowflake(config.env.welcomeChannelId)) {
        errors.push("WELCOME_CHANNEL_ID không hợp lệ: phải là Discord Snowflake ID");
    }

    // if (!config.welcome.background.imagePath || config.welcome.background.imagePath === "/path/to/welcome_bg.png") {
    //     errors.push("Thiếu đường dẫn ảnh nền (welcome.background.imagePath)");
    // }

    // if (!config.welcome.avatar.x || config.welcome.avatar.y === undefined) {
    //     errors.push("Thiếu tọa độ avatar (welcome.avatar.x hoặc welcome.avatar.y)");
    // }

    // if (!config.welcome.text.welcome.x || config.welcome.text.welcome.y === undefined) {
    //     errors.push("Thiếu tọa độ chữ welcome (welcome.text.welcome.x hoặc welcome.text.welcome.y)");
    // }

    return errors;
}


module.exports = validateConfig;