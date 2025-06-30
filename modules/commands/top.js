const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");

const CHECKTT_PATH = path.join(__dirname, "checktt");

module.exports.config = {
  name: "top",
  version: "2.1.0",
  hasPermssion: 3,
  credits: "JRT mod by Niiozic ",
  description: "Thống kê nhóm hoạt động nhất trong tuần ",
  commandCategory: "Thống kê",
  usages: "[thread/level]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args, Currencies, Users }) => {
  const { threadID: t, messageID: m } = event;
  const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");

  if (args.length === 0)
    return api.sendMessage(
      `[ Lựa chọn thống kê ]\n\n${global.config.PREFIX}top thread → top nhóm hoạt động nhất tuần\n${global.config.PREFIX}top level → top người có cấp cao nhất\n=====「${timeNow}」=====`,
      t, m
    );

  const LV = (x) => Math.floor((Math.sqrt(1 + (4 * x) / 3) + 1) / 2);

  // Top level
  if (args[0] == "level") {
    let all = await Currencies.getAll(['userID', 'exp']);
    all.sort((a, b) => b.exp - a.exp);
    let msg = '📊 Top 15 người dùng có level cao nhất server 📊\n\n';
    for (let i = 0; i < Math.min(15, all.length); i++) {
      let level = LV(all[i].exp);
      let name = (await Users.getData(all[i].userID)).name;
      msg += `${i + 1}. ${name} - cấp ${level}\n`;
    }
    return api.sendMessage(msg, t, m);
  }

  // Top thread (lấy từ dữ liệu checktt)
  if (args[0] === "thread") {
    if (!fs.existsSync(CHECKTT_PATH)) return api.sendMessage("❎ Không tìm thấy thư mục checktt.", t, m);

    const files = fs.readdirSync(CHECKTT_PATH).filter(file => file.endsWith(".json"));
    const result = [];

    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(CHECKTT_PATH, file)));
        const totalWeek = Array.isArray(data.week) ? data.week.reduce((sum, user) => sum + (user.count || 0), 0) : 0;
        if (totalWeek > 0) {
          result.push({
            threadID: file.replace(".json", ""),
            totalWeek
          });
        }
      } catch (e) {
        console.log(`Lỗi đọc file ${file}:`, e);
      }
    }

    // Lấy tên nhóm
    for (const item of result) {
      try {
        const info = await api.getThreadInfo(item.threadID);
        item.name = info.threadName || "Không tên";
      } catch {
        item.name = "Không truy cập được";
      }
    }

    result.sort((a, b) => b.totalWeek - a.totalWeek);
    const top = result.slice(0, 10);

    let msg = `🔥 Top nhóm hoạt động nhiều nhất tuần 🔥\n\n`;
    top.forEach((group, index) => {
      msg += `${index + 1}. ${group.name}\n💬 Tin nhắn: ${group.totalWeek.toLocaleString()}\n\n`;
    });

    return api.sendMessage(msg, t, m);
  }
};
