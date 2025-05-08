const fs = require("fs");
const path = __dirname + "/../../data/camtu.json";

function readData() {
  if (!fs.existsSync(path)) fs.writeFileSync(path, "{}");
  return JSON.parse(fs.readFileSync(path));
}

function writeData(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

module.exports.config = {
  name: "camtu",
  version: "1.1.0",
  hasPermssion: 1,
  credits: "sứa",
  description: "Quản lý từ cấm trong nhóm",
  commandCategory: "Tiện ích nhóm",
  usages: "camtu on | off | add <từ> | del <từ> | list | reset",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const data = readData();
  if (!data[threadID]) data[threadID] = { enabled: false, badWords: [], violations: {} };
  const group = data[threadID];

  const sub = args[0];
  if (!sub) return api.sendMessage("⚙️ Dùng: camtu on | off | add <từ> | del <từ> | list | reset", threadID, messageID);

  switch (sub) {
    case "on":
      group.enabled = true;
      writeData(data);
      return api.sendMessage("✅ Đã bật kiểm tra từ cấm.", threadID, messageID);

    case "off":
      group.enabled = false;
      writeData(data);
      return api.sendMessage("❎ Đã tắt kiểm tra từ cấm.", threadID, messageID);

    case "add":
      if (!args[1]) return api.sendMessage("❌ Vui lòng nhập từ cần thêm.", threadID, messageID);
      const addWord = args[1].toLowerCase();
      if (group.badWords.includes(addWord))
        return api.sendMessage("⚠️ Từ này đã có trong danh sách.", threadID, messageID);
      group.badWords.push(addWord);
      writeData(data);
      return api.sendMessage(`✅ Đã thêm từ cấm: "${addWord}"`, threadID, messageID);

    case "del":
      if (!args[1]) return api.sendMessage("❌ Vui lòng nhập từ cần xóa.", threadID, messageID);
      const delWord = args[1].toLowerCase();
      group.badWords = group.badWords.filter(w => w !== delWord);
      writeData(data);
      return api.sendMessage(`✅ Đã xóa từ cấm: "${delWord}"`, threadID, messageID);

    case "list":
      return api.sendMessage(
        `📃 Danh sách từ cấm:\n${group.badWords.join(", ") || "Không có từ nào."}`,
        threadID,
        messageID
      );

    case "reset": {
      let targetID;

      // Nếu reply ai đó
      if (event.type === "message_reply") {
        targetID = event.messageReply.senderID;
      }
      // Nếu có tag
      else if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }
      // Không xác định được
      else {
        return api.sendMessage("⚠️ Vui lòng reply hoặc tag người cần reset vi phạm.", threadID, messageID);
      }

      if (!group.violations[targetID]) {
        return api.sendMessage("👤 Người này chưa vi phạm hoặc đã được reset.", threadID, messageID);
      }

      delete group.violations[targetID];
      writeData(data);
      return api.sendMessage(`✅ Đã reset số lần vi phạm cho người dùng: ${targetID}`, threadID, messageID);
    }

    default:
      return api.sendMessage("⚙️ Dùng: camtu on | off | add <từ> | del <từ> | list | reset", threadID, messageID);
  }
};
