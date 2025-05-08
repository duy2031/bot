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
  eventType: ["message"],
  version: "1.0.0",
  credits: "ChatGPT",
  description: "Tự động kiểm tra từ cấm"
};

module.exports.run = async function({ api, event }) {
  const { threadID, senderID, body } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  const data = readData();
  const group = data[threadID];
  if (!group || !group.enabled || !group.badWords.length) return;

  const text = body.toLowerCase();
  const viPham = group.badWords.find(word => text.includes(word));
  if (!viPham) return;

  // Tăng số lần vi phạm
  if (!group.violations[senderID]) group.violations[senderID] = 0;
  group.violations[senderID] += 1;

  writeData(data);

  const count = group.violations[senderID];
  if (count >= 5) {
    try {
      await api.removeUserFromGroup(senderID, threadID);
      return api.sendMessage(`🚫 ${count} lần vi phạm từ cấm → đã bị kick.`, threadID);
    } catch (e) {
      return api.sendMessage(`⚠️ Người dùng vi phạm ${count} lần nhưng bot không đủ quyền để kick.`, threadID);
    }
  } else {
    return api.sendMessage(
      `⚠️ Cảnh báo: Bạn đã dùng từ cấm "${viPham}" (${count}/5).`,
      threadID
    );
  }
};
