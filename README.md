# Discord Bot

Bot Discord xây dựng bằng discord.js, tự động gửi welcome card khi có thành viên mới tham gia server.

## Tính năng

- **Chào mừng thành viên mới**: Tự động tạo và gửi thẻ chào mừng Canvas (chọn ngẫu nhiên theme sáng/tối). Nếu tạo ảnh hoặc gửi ảnh thất bại, bot tự động chuyển sang gửi Embed text dự phòng.
- **Hệ thống Slash Commands**:
  - `/ping` 🔒 — Kiểm tra bot có đang hoạt động không và xem độ trễ (latency). Yêu cầu người dùng có quyền `ManageMessages`.
  - `/help` — Hiển thị danh sách các lệnh của bot kèm biểu tượng thể hiện giới hạn quyền.
  - `/about` — Hiển thị thông tin bot (phiên bản, thời gian uptime, múi giờ, ping).
- **Phân quyền và bảo mật**:
  - Kiểm tra quyền runtime trước khi thực thi lệnh.
  - Hỗ trợ channel permission overwrites (kiểm tra quyền thực tế trong từng kênh thay vì chỉ kiểm tra quyền chung của guild).
  - Kiểm tra quyền của bot (ví dụ: `SendMessages`, `EmbedLinks`, `AttachFiles`) trước khi phản hồi hoặc gửi tin nhắn chào mừng.
- **Cooldown**: Quản lý thời gian hồi chiêu theo từng lệnh để chống spam.
- **Hệ thống Logging**: Ghi log có màu ra console và file `logs/latest.log` theo múi giờ `Asia/Ho_Chi_Minh`, tự động xoay vòng file log (khi đạt 5MB, lưu tối đa 5 bản lưu trữ) và tự chuyển sang console nếu hệ thống file gặp sự cố.

## Công nghệ & Thư viện sử dụng

- [Node.js](https://nodejs.org/) (khuyến nghị phiên bản 18 trở lên)
- [discord.js](https://discord.js.org/) (v14)
- `dotenv` — Quản lý biến môi trường
- `canvas` — Vẽ thẻ chào mừng
- `chalk` — Tô màu log console
- `luxon` — Định dạng thời gian và múi giờ

## Phạm vi hoạt động (Guild & Channel Scope)

- **Đăng ký lệnh**: Hiện tại các slash command được đăng ký cho máy chủ thử nghiệm được cấu hình qua `GUILD_ID` (sử dụng application guild commands).
- **Kênh chào mừng**: Bot gửi thông báo chào mừng cố định vào kênh có ID được chỉ định qua `WELCOME_CHANNEL_ID`.
- *Lưu ý*: Dự án hiện chưa hỗ trợ cấu hình động riêng biệt cho nhiều server khác nhau.

## Cấu hình Discord Gateway Intents

Trong [Discord Developer Portal](https://discord.com/developers/applications):
1. Truy cập Application của bạn -> chọn mục **Bot**.
2. Tại phần **Privileged Gateway Intents**, bật:
   - **Server Members Intent (`GuildMembers`)**: Bắt buộc để bot nhận sự kiện `guildMemberAdd` khi có thành viên mới vào server.
3. *Lưu ý*: Bot **không** yêu cầu Message Content Intent vì toàn bộ lệnh sử dụng Slash Commands (Interactions API).

## Hướng dẫn cài đặt & khởi chạy

1. Clone repository:
   ```bash
   git clone https://github.com/FynnML/BotDiscord.git
   cd BotDiscord
   ```

2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

3. Tạo file `.env` tại thư mục gốc của dự án:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here
   WELCOME_CHANNEL_ID=your_welcome_channel_id_here
   ```
   **Giải thích các biến môi trường:**
   - `DISCORD_TOKEN`: Token bí mật của bot Discord lấy từ Developer Portal -> Bot -> Reset Token.
   - `CLIENT_ID`: Application ID (Snowflake) của ứng dụng bot lấy từ Developer Portal -> General Information.
   - `GUILD_ID`: ID máy chủ Discord mà bạn muốn đăng ký các lệnh slash để thử nghiệm.
   - `WELCOME_CHANNEL_ID`: ID kênh văn bản trong server nơi bot sẽ gửi thông báo chào mừng.

4. Khởi chạy bot:
   ```bash
   node src/index.js
   ```

## Cấu trúc thư mục

```
src/
├── commands/     # Slash commands (/ping, /help, /about)
├── config/       # Cấu hình biến môi trường, màu sắc, welcome card, permissions
├── events/       # Xử lý sự kiện Discord (ready, guildMemberAdd, interactionCreate)
├── handlers/     # Trình nạp lệnh (loadCommands) và đăng ký lệnh với REST API (registerCommands)
└── utils/        # Canvas, logger (có xoay vòng & flush), cooldownManager, permissionChecker
```
