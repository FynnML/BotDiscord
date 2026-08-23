# Discord Bot

Bot Discord xây dựng bằng discord.js, tự động gửi welcome card khi có thành viên mới tham gia server.
Đây chỉ là project học tập nên có thể có lỗi.

## Tính năng

- Tự động gửi embed chào mừng kèm ảnh welcome card tạo bằng Canvas khi có thành viên mới vào server (có gửi dự phòng bằng Embed Text nếu tạo ảnh bị lỗi)
- Ảnh welcome card chọn ngẫu nhiên giữa 2 theme nền sáng/tối
- Các lệnh slash: `/ping`, `/help`, `/about`, và `/permissions-test` (dùng để test phân quyền)
- Hệ thống phân quyền cho từng lệnh
- Cooldown cho lệnh để tránh spam
- Ghi log có màu ra console và ra file `logs/latest.log`, kèm timestamp theo giờ Việt Nam

## Công nghệ sử dụng

- [Node.js](https://nodejs.org/)
- [discord.js](https://discord.js.org/)
- dotenv — quản lý biến môi trường
- canvas — tạo ảnh welcome card
- chalk, luxon — log ra console có màu và timestamp

## Cài đặt

```bash
git clone https://github.com/FynnML/Bot-discord.git
cd Bot-discord
npm install
```

Tạo file `.env` ở thư mục gốc (tên biến bên dưới chỉ là ví dụ — kiểm tra lại `src/config/env.js` và `src/config/validate.js` để lấy đúng tên biến bot đang yêu cầu):

```
DISCORD_TOKEN = Token của bot.
CLIENT_ID = Application ID của bot.
GUILD_ID = ID Server Discord.
WELCOME_CHANNEL_ID = ID Channel Welcome.
```

Chạy bot:

```bash
node src/index.js
```

## Cấu trúc dự án

```
src/
├── commands/     # Các lệnh slash
├── config/       # Cấu hình, biến môi trường, màu sắc
├── events/       # Sự kiện Discord: ready, guildMemberAdd, interactionCreate
├── handlers/     # Đăng ký và xử lý lệnh
└── utils/        # Canvas, logger, cooldown, kiểm tra quyền
```
