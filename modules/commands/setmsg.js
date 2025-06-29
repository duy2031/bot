module.exports.config = {
  name: "setmsg",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "ChatGPT chuyển thể từ setmoney",
  description: "Điều chỉnh dữ liệu đếm tin nhắn",
  commandCategory: "Admin",
  usages: "[add/set/clean/reset] [số] [tag]",
  cooldowns: 5
};

const fs = require("fs-extra");
const path = __dirname + "/checktt/";
const moment = require("moment-timezone");

module.exports.run = async function ({ event, api, args }) {
  const { threadID, messageID, senderID, mentions } = event;
  const mentionIDs = Object.keys(mentions);
  const today = moment.tz("Asia/Ho_Chi_Minh").day();
  const filePath = `${path}${threadID}.json`;

  if (!fs.existsSync(filePath)) return api.sendMessage("⚠️ Nhóm chưa có dữ liệu tương tác!", threadID, messageID);
  let data = JSON.parse(fs.readFileSync(filePath));

  const action = args[0];
  const count = parseInt(args[1]);
  const targetIDs = mentionIDs.length ? mentionIDs : [senderID];

  if (["add", "set"].includes(action) && (isNaN(count) || count < 0)) {
    return api.sendMessage("❎ Số tin nhắn không hợp lệ.", threadID, messageID);
  }

  const modifyField = (field, userID, mode) => {
    const idx = data[field].findIndex(e => e.id == userID);
    if (idx === -1) data[field].push({ id: userID, count: mode == "set" ? count : count });
    else data[field][idx].count = mode == "set" ? count : data[field][idx].count + count;
  };

  try {
    switch (action) {
      case "add":
      case "set": {
        for (const id of targetIDs) {
          modifyField("total", id, action);
          modifyField("week", id, action);
          modifyField("day", id, action);
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        return api.sendMessage(`✅ Đã ${action == "add" ? "cộng" : "set"} ${count} tin cho ${targetIDs.length} người.`, threadID, messageID);
      }

      case "clean": {
        for (const id of targetIDs) {
          ["total", "week", "day"].forEach(field => {
            const idx = data[field].findIndex(e => e.id == id);
            if (idx !== -1) data[field][idx].count = 0;
          });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        return api.sendMessage(`✅ Đã xóa dữ liệu tin nhắn của ${targetIDs.length} người.`, threadID, messageID);
      }

      case "reset": {
        fs.unlinkSync(filePath);
        return api.sendMessage("✅ Đã reset toàn bộ dữ liệu tương tác của nhóm.", threadID, messageID);
      }

      default: {
        return api.sendMessage("❎ Lệnh không hợp lệ. Hãy dùng: add, set, clean, reset", threadID, messageID);
      }
    }
  } catch (e) {
    console.error(e);
    return api.sendMessage("❌ Đã xảy ra lỗi khi xử lý lệnh.", threadID, messageID);
  }
};
