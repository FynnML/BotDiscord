const config = require("./index");

function validateConfig() {
    const errors = [];

    if (!config.env.token) {
        errors.push("Thiếu DISCORD_TOKEN trong file .env");
    }

    if (!config.env.welcomeChannelId) {
        errors.push("Thiếu WELCOME_CHANNEL_ID trong file .env");
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