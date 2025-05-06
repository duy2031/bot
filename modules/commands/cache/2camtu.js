const { existsSync, writeFileSync, readFileSync } = require("fs-extra");
const { resolve } = require("path");

const filePath = resolve(__dirname, 'cache/data/camtu.json');
if (!existsSync(filePath)) writeFileSync(filePath, JSON.stringify({}, null, 2));

module.exports.config = {
  name: "camtu",
  version: "2.0.0",
  credits: "NTKhang (edit by DEV NDK)",
  hasPermssion: 1,
  description: "Cảnh báo thành viên vi phạm từ cấm (auto kick sau 5 lần)",
  usages: "camtu on/off/add/del/list",
  commandCategory: "Quản trị viên",
  cooldowns: 3
};

function saveData(data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getData() {
  return JSON.parse(readFileSync(filePath));
}

module.exports.run = async ({ api, event, args }) => {
  const threadID = event.threadID;
  let data = getData();

  if (!data[threadID]) data[threadID] = { words: [], enable: false, violations: {} };
  const group = data[threadID];

  switch (args[0]) {
    case "on":
      group.enable = true;
      saveData(data);
      return api.sendMessage("[ MODE ] - Đã bật auto cấm từ", threadID, event.messageID);
    case "off":
      group.enable = false;
      saveData(data);
      return api.sendMessage("[ MODE ] - Đã tắt auto cấm từ", threadID, event.messageID);
    case "add":
      if (!args[1]) return api.sendMessage("[ MODE ] - Nhập từ cần thêm", threadID, event.messageID);
      const wordsToAdd = args.slice(1).join(" ").split(",").map(x => x.trim().toLowerCase());
      const added = wordsToAdd.filter(w => !group.words.includes(w));
      group.words.push(...added);
      saveData(data);
      return api.sendMessage(`[ MODE ] - Đã thêm ${added.length} từ`, threadID, event.messageID);
    case "del":
      const wordsToDel = args.slice(1).join(" ").split(",").map(x => x.trim().toLowerCase());
      const removed = wordsToDel.filter(w => group.words.includes(w));
      group.words = group.words.filter(w => !removed.includes(w));
      saveData(data);
      return api.sendMessage(`[ MODE ] - Đã xoá ${removed.length} từ`, threadID, event.messageID);
    case "list":
      if (group.words.length === 0) return api.sendMessage("[ MODE ] - Danh sách trống", threadID);
      return api.sendMessage("[ MODE ] - Danh sách từ cấm:\n" + group.words.map(w => `- ${w}`).join("\n"), threadID);
    default:
      return api.sendMessage(
        `━━━━━ [ Auto cấm từ ] ━━━━━\n\n→ ${global.config.PREFIX}camtu add + từ cần cấm\n→ ${global.config.PREFIX}camtu del + từ đã cấm\n→ ${global.config.PREFIX}camtu list\n→ ${global.config.PREFIX}camtu on/off`,
        threadID
      );
  }
};

module.exports.handleEvent = async ({ api, event, Threads }) => {
  const { threadID, senderID, body } = event;
  if (!body) return;

  let data = getData();
  if (!data[threadID]) return;

  const group = data[threadID];
  if (!group.enable || !group.words || group.words.length === 0) return;

  const msgLower = body.toLowerCase();
  const matched = group.words.find(word => msgLower.includes(word));
  if (!matched) return;

  if (!group.violations) group.violations = {};
  if (!group.violations[senderID]) group.violations[senderID] = 0;

  group.violations[senderID] += 1;
  const count = group.violations[senderID];

  if (count >= 5) {
    try {
      await api.removeUserFromGroup(senderID, threadID);
      api.sendMessage(`[ MODE ] - Thành viên đã bị kick sau 5 lần vi phạm`, threadID);
      group.violations[senderID] = 0; // Reset vi phạm
    } catch (err) {
      api.sendMessage("[ MODE ] - Không thể kick. Hãy đảm bảo bot có quyền quản trị viên", threadID);
    }
  } else {
    api.sendMessage(`[ MODE ] - Phát hiện từ cấm '${matched}'. Bạn đã vi phạm ${count}/5 lần.`, threadID);
  }

  saveData(data);
};

module.exports.handleReaction = async ({ api, event, handleReaction, Users, Threads }) => {
  const { threadID, userID, reaction, messageID } = event;
  const { targetID, messageID: targetMsgID } = handleReaction;

  const threadInfo = global.data.threadInfo.get(threadID) || await Threads.getInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(e => e.id == userID);
  const isBotAdmin = [...global.config.ADMINBOT, ...global.config.NDH].includes(userID);
  if (!isAdmin && !isBotAdmin) return;

  const angry = "😠";
  const like = "👍";

  if (reaction === angry) {
    try {
      await api.removeUserFromGroup(targetID, threadID);
      await api.unsendMessage(targetMsgID);
      const kicker = await Users.getNameUser(userID);
      const kicked = await Users.getNameUser(targetID);
      api.sendMessage(`[ MODE ] - ${kicker} đã xác nhận kick thành viên ${kicked}`, threadID);
    } catch {
      api.sendMessage("[ MODE ] - Không thể kick. Bot cần quyền quản trị viên.", threadID);
    }
  } else if (reaction === like) {
    await api.unsendMessage(targetMsgID);
  }
};
