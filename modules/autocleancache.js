const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "..", "cache");
const INTERVAL = 2 * 60 * 60 * 1000; // 2 tiếng

const MEDIA_EXTENSIONS = [
  ".mp3", ".mp4", ".wav", ".m4a", ".avi", ".mkv", ".webm",
  ".ogg", ".flac", ".mov"
];

function cleanMediaFiles() {
  fs.readdir(CACHE_DIR, (err, files) => {
    if (err) return console.error("[AutoClean] Lỗi đọc cache:", err);

    files.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);

      if (fs.statSync(filePath).isDirectory()) return; // Bỏ qua thư mục

      const ext = path.extname(file).toLowerCase();
      if (MEDIA_EXTENSIONS.includes(ext)) {
        fs.unlink(filePath, err => {
          if (err) console.error(`[AutoClean] Lỗi xóa file ${file}:`, err);
          else console.log(`[AutoClean] Đã xóa media: ${file}`);
        });
      }
    });
  });
}

// Chạy ngay khi bot khởi động
cleanMediaFiles();

// Lặp lại mỗi 2 tiếng
setInterval(cleanMediaFiles, INTERVAL);
