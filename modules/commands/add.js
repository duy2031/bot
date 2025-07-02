const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "add",
    version: "3.0",
    author: "ChatGPT",
    countDown: 5,
    role: 2,
    shortDescription: "Thêm lệnh từ link trong reply",
    longDescription: "Reply link raw (pastebin, github...) để thêm lệnh",
    category: "Admin",
    guide: "{pn} <tênFile.js> (reply vào link pastebin raw)"
  },

  onStart: async function ({ message, event, args }) {
    const fileName = args[0];
    if (!fileName || !fileName.endsWith(".js"))
      return message.reply("⚠️ Nhập tên file kết thúc bằng `.js` (ví dụ: test.js)");

    const replyText = event.messageReply?.body?.trim();
    if (!replyText || !isRawUrl(replyText))
      return message.reply("⚠️ Bạn cần reply vào một tin nhắn chứa link raw (vd: pastebin.com/raw/xxx)");

    // Tải nội dung code từ link
    let code;
    try {
      const res = await axios.get(replyText);
      code = res.data;
    } catch (err) {
      return message.reply("❌ Không thể tải nội dung từ link. Kiểm tra lại URL.");
    }

    const filePath = path.join(__dirname, fileName);

    if (fs.existsSync(filePath)) {
      return message.reply(
        `⚠️ File ${fileName} đã tồn tại. Bạn muốn:\n1️⃣ Ghi đè\n2️⃣ Tạo file mới: ${fileName.replace(".js", "2.js")}\n\nVui lòng reply với số 1 hoặc 2.`,
        (err, info) => {
          global.replyAddCommand = {
            messageID: info.messageID,
            fileName,
            code
          };
        }
      );
    }

    saveAndLoad(filePath, code, message);
  },

  onReply: async function ({ message, event }) {
    const data = global.replyAddCommand;
    if (!data) return;

    const { messageID, fileName, code } = data;
    if (event.messageReply?.messageID !== messageID) return;

    const choice = event.body.trim();
    if (choice !== "1" && choice !== "2")
      return message.reply("⚠️ Chỉ nhập 1 hoặc 2.");

    const newFileName = choice === "2"
      ? fileName.replace(".js", "2.js")
      : fileName;
    const filePath = path.join(__dirname, newFileName);

    saveAndLoad(filePath, code, message);
    delete global.replyAddCommand;
  }
};

// Kiểm tra URL hợp lệ
function isRawUrl(url) {
  return /^https?:\/\/(pastebin\.com\/raw\/|gist\.githubusercontent\.com\/|raw\.githubusercontent\.com\/)/.test(url);
}

// Ghi file và load lệnh
function saveAndLoad(filePath, code, message) {
  try {
    fs.writeFileSync(filePath, code);
    delete require.cache[require.resolve(filePath)];
    require(filePath);
    message.reply(`✅ Đã thêm và load lệnh: ${path.basename(filePath)}`);
  } catch (err) {
    message.reply("❌ Lỗi khi ghi hoặc load file: " + err.message);
  }
}
