// src/config/welcome.js
const path = require("path");

module.exports = {
  canvas: {
    width: 800,
    height: 400,
  },
  background: {
    // Relative path to root of the project
    images: [
      path.join(__dirname, "../../assets/images/welcome_bg_light.png"),
      path.join(__dirname, "../../assets/images/welcome_bg_dark.png")
    ],
  },
  overlay: {
    margin: 20,
    radius: 20,
    // Gradient trái (đậm, để chữ nổi) -> phải (trong suốt dần, giữ minh họa nền),
    // thay vì phủ đen đều cả tấm làm mất chi tiết tranh nền
    gradient: [
      { offset: 0, color: "rgba(8, 12, 28, 0.72)" },
      { offset: 0.5, color: "rgba(8, 12, 28, 0.42)" },
      { offset: 1, color: "rgba(8, 12, 28, 0)" },
    ],
  },
  avatar: {
    x: 50,
    y: 100,
    size: 200,
    borderColor: "#ffffff",
    borderWidth: 8,
    // Provide a fallback if user's avatar fails to load
    fallbackColor: "#7289da",
    shadow: {
      color: "rgba(0, 0, 0, 0.55)",
      blur: 18,
      offsetX: 0,
      offsetY: 8,
    },
  },
  shadow: {
    color: "rgba(0, 0, 0, 0.75)",
    blur: 10,
    offsetX: 3,
    offsetY: 3,
  },
  text: {
    lineGap: 18, // khoảng cách giữa dòng WELCOME và username
    // Tâm dọc của khối WELCOME + username. Trước đây canh theo tâm avatar (200)
    // nhưng vậy hơi thấp, đè lên đầu con mèo nhỏ trong tranh nền — tách riêng
    // thành 1 số độc lập để chỉnh lên/xuống mà không phụ thuộc avatar nữa.
    // Số càng nhỏ thì khối chữ càng lên cao.
    blockAnchorY: 165,
    welcome: {
      font: "900 62px 'Arial Black', Impact, sans-serif",
      color: "#ffffff",
      align: "left",
      baseline: "alphabetic",
      x: 280,
    },
    username: {
      // Không còn 1 cỡ chữ cố định — tự thu nhỏ dần từ maxSize xuống minSize
      // cho tới khi vừa maxWidth, chỉ truncate (...) nếu chạm minSize mà vẫn tràn
      weight: "800",
      family: "'Arial Black', Impact, sans-serif",
      maxSize: 42,
      minSize: 24, // không nhỏ hơn cỡ chữ của dòng Joined At
      color: "#ffd98a", // vàng ấm, tách phân cấp rõ với WELCOME
      align: "left",
      baseline: "alphabetic",
      x: 280,
      maxWidth: 460,
    },
    joinTime: {
      font: "600 24px Arial, sans-serif",
      color: "rgba(255, 255, 255, 0.85)",
      align: "left",
      baseline: "top",
      x: 50, // canh cùng lề trái với avatar cho cân đối
      y: 335,
      maxWidth: 500,
    },
  },
};