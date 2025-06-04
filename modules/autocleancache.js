const fs = require('fs');
const path = require('path');

const TARGET_FOLDER = path.join(__dirname, 'cache');
const EXTENSIONS = ['.m4a', '.mp4', '.mp3', '.gif', '.jpg', '.png'];
const INTERVAL_HOURS = 2 * 60 * 60 * 1000; // 2 giờ

function cleanCache() {
  if (!fs.existsSync(TARGET_FOLDER)) return;

  const files = fs.readdirSync(TARGET_FOLDER);
  let deleted = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (EXTENSIONS.includes(ext)) {
      try {
        fs.unlinkSync(path.join(TARGET_FOLDER, file));
        deleted++;
      } catch (err) {
        console.error(`❌ Lỗi xóa file ${file}: ${err.message}`);
      }
    }
  }

  console.log(`[AutoCleanCache] Đã xóa ${deleted} file vào lúc ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
}

// Chạy ngay khi module được load
cleanCache();
// Đặt timer chạy định kỳ mỗi 2h
setInterval(cleanCache, INTERVAL_HOURS);

module.exports.config = {
  name: "autocleancache",
  version: "1.0.0",
  hasPermission: 3,
  credits: "ChatGPT (edit by bạn)",
  description: "Tự động xóa các file media trong cache mỗi 2 giờ",
  commandCategory: "hệ thống",
  usages: "",
  cooldowns: 5,
  usePrefix: false,
};

module.exports.run = async function() {
  // Có thể để trống hoặc để log
  return;
};
