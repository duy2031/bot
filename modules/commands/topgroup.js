module.exports.config = {
  name: "topgroup",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Yuki Rewrite",
  description: "Xem top 15 nhóm có tương tác cao nhất",
  commandCategory: "group",
  usages: "[topgroup]",
  cooldowns: 5
};

const fs = require('fs');
const path = require('path');

module.exports.run = async function ({ api, event, Threads, prefix }) {
  try {
    const dataPath = __dirname + '/../commands/cache/checktt';
    const allData = [];

    fs.readdirSync(dataPath).forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(dataPath, file);
        const jsonData = JSON.parse(fs.readFileSync(filePath));
        const totalMessages = Object.values(jsonData).reduce((a, b) => a + b, 0);
        const threadID = file.replace('.json', '');
        allData.push({ threadID, totalMessages });
      }
    });

    allData.sort((a, b) => b.totalMessages - a.totalMessages);
    const topGroups = allData.slice(0, 15);
    let msg = '📊 Top 15 nhóm có tổng tương tác cao nhất:\n\n';

    for (let i = 0; i < topGroups.length; i++) {
      const { threadID, totalMessages } = topGroups[i];
      const threadInfo = await Threads.getData(threadID);
      const threadName = threadInfo.threadInfo?.threadName || "Không tên";
      msg += `${i + 1}. ${threadName} (ID: ${threadID}) - Tin nhắn: ${totalMessages}\n`;
    }

    return api.sendMessage(msg, event.threadID, event.messageID);
  } catch (error) {
    console.error(error);
    return api.sendMessage('❌ Đã xảy ra lỗi khi lấy dữ liệu.', event.threadID, event.messageID);
  }
};
