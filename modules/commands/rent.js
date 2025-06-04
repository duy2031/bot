const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const RENT_DATA_PATH = path.join(__dirname, 'data_rent.json');
const TIMEZONE = 'Asia/Ho_Chi_Minh';

let data = fs.existsSync(RENT_DATA_PATH) ? JSON.parse(fs.readFileSync(RENT_DATA_PATH, 'utf8')) : [];

const saveData = () => {
  fs.writeFileSync(RENT_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
};

const formatDate = dateStr => dateStr.split('/').reverse().join('/');
const isInvalidDate = dateStr => isNaN(new Date(formatDate(dateStr)).getTime());

module.exports.config = {
  name: "rent",
  version: "1.0.6",
  hasPermission: 3,
  credits: "NTK",
  description: "Quản lý thuê bot theo nhóm",
  commandCategory: "admin",
  usePrefix: false,
  usages: "",
  cooldowns: 1,
};

module.exports.run = async function({ api, event, args }) {
  const sendMessage = (msg) => api.sendMessage(msg, event.threadID, event.messageID);
  const ADMINBOT = global.config.ADMINBOT;

  if (!ADMINBOT.includes(event.senderID)) return sendMessage("Bạn không có quyền sử dụng lệnh này!");

  switch (args[0]) {
    case "add": {
      let threadID = event.threadID;
      let userID = Object.keys(event.mentions || {})[0] ||
                   (event.messageReply && event.messageReply.senderID) ||
                   event.senderID;

      let time_end = args[1];
      if (!time_end) return sendMessage("❌ Thiếu ngày hết hạn! Dùng: rent add <dd/mm/yyyy>");
      if (isInvalidDate(time_end)) return sendMessage("❌ Ngày không hợp lệ! Định dạng đúng: dd/mm/yyyy");

      if (data.some(e => e.t_id === threadID)) return sendMessage("❌ Nhóm này đã thuê bot rồi!");

      const time_start = moment.tz(TIMEZONE).format('DD/MM/YYYY');
      data.push({ t_id: threadID, id: userID, time_start, time_end });
      saveData();

      let userName = "Không xác định";
      try {
        const userInfo = await api.getUserInfo(userID);
        userName = userInfo[userID]?.name || userName;
      } catch (e) {}

      return sendMessage(`✅ Đã thêm thuê bot cho nhóm đến ngày ${time_end}\n👤 Người thuê: ${userName}`);
    }

    case "info": {
      let info = data.find(e => e.t_id === event.threadID);
      if (!info) return sendMessage("❌ Nhóm này chưa thuê bot.");

      let end = new Date(formatDate(info.time_end)).getTime();
      let now = Date.now();
      let days = Math.floor((end - now) / (1000 * 60 * 60 * 24));
      let hours = Math.floor(((end - now) / (1000 * 60 * 60)) % 24);

      return sendMessage(`📄 Thuê bot bởi: ${info.id}\n📆 Bắt đầu: ${info.time_start}\n⏰ Kết thúc: ${info.time_end}\n⏳ Còn lại: ${days} ngày ${hours} giờ`);
    }

    case "list": {
      if (data.length === 0) return sendMessage("📭 Danh sách thuê bot trống.");
      let msg = "📋 Danh sách nhóm thuê bot:\n";

      for (let i = 0; i < data.length; i++) {
        let e = data[i];
        let status = (new Date(formatDate(e.time_end)).getTime() >= Date.now()) ? "✅ Còn hạn" : "⛔ Hết hạn";

        let threadName = e.t_id;
        try {
          const threadInfo = await api.getThreadInfo(e.t_id);
          threadName = threadInfo.threadName || threadName;
        } catch (err) {}

        let userName = e.id;
        try {
          const userInfo = await api.getUserInfo(e.id);
          userName = userInfo[e.id]?.name || userName;
        } catch (err) {}

        msg += `\n${i + 1}. Nhóm: ${threadName} - ${status}\n→ Người thuê: ${userName}\n→ Hết hạn: ${e.time_end}`;
      }

      return sendMessage(msg);
    }

    case "del": {
      if (!args[1]) return sendMessage("❌ Thiếu tham số. Dùng: rent del <số thứ tự | tên nhóm>");

      let index = -1;
      if (!isNaN(args[1])) {
        index = parseInt(args[1]) - 1;
      } else {
        const nameQuery = args.slice(1).join(" ").toLowerCase();
        for (let i = 0; i < data.length; i++) {
          try {
            const threadInfo = await api.getThreadInfo(data[i].t_id);
            const threadName = threadInfo.threadName?.toLowerCase() || "";
            if (threadName.includes(nameQuery)) {
              index = i;
              break;
            }
          } catch (err) {}
        }
      }

      if (index < 0 || index >= data.length) return sendMessage("❌ Không tìm thấy nhóm cần xóa.");

      const removed = data.splice(index, 1)[0];
      saveData();

      let groupName = removed.t_id;
      try {
        const threadInfo = await api.getThreadInfo(removed.t_id);
        groupName = threadInfo.threadName || groupName;
      } catch (e) {}

      return sendMessage(`✅ Đã gỡ thuê bot khỏi nhóm: ${groupName}`);
    }

    case "giahan": {
      const newDate = args[1];
      if (!newDate) return sendMessage("❌ Thiếu ngày mới. Dùng: rent giahan <dd/mm/yyyy> [số | tên nhóm]");
      if (isInvalidDate(newDate)) return sendMessage("❌ Ngày không hợp lệ! Định dạng đúng: dd/mm/yyyy");

      let targetIndex = -1;

      if (!args[2]) {
        targetIndex = data.findIndex(e => e.t_id === event.threadID);
      } else if (!isNaN(args[2])) {
        const index = parseInt(args[2]) - 1;
        if (index >= 0 && index < data.length) targetIndex = index;
      } else {
        const nameQuery = args.slice(2).join(" ").toLowerCase();
        for (let i = 0; i < data.length; i++) {
          try {
            const threadInfo = await api.getThreadInfo(data[i].t_id);
            const threadName = threadInfo.threadName?.toLowerCase() || "";
            if (threadName.includes(nameQuery)) {
              targetIndex = i;
              break;
            }
          } catch (e) {}
        }
      }

      if (targetIndex === -1) return sendMessage("❌ Không tìm thấy nhóm cần gia hạn.");

      const groupData = data[targetIndex];
      const oldDate = groupData.time_end;
      groupData.time_end = newDate;
      saveData();

      let groupName = groupData.t_id;
      try {
        const threadInfo = await api.getThreadInfo(groupData.t_id);
        groupName = threadInfo.threadName || groupName;

        // Thông báo đến nhóm
        api.sendMessage(
          `✅ Nhóm "${groupName}" đã được gia hạn thuê bot đến ngày ${newDate} (trước đó: ${oldDate})`,
          groupData.t_id
        );
      } catch (e) {}

      return sendMessage(`✅ Đã gia hạn thành công cho nhóm "${groupName}" đến ngày ${newDate}`);
    }

    default: {
      return sendMessage(
        "🔧 Hướng dẫn sử dụng:\n" +
        "- rent add <dd/mm/yyyy> (tag hoặc reply người thuê)\n" +
        "- rent info\n" +
        "- rent list\n" +
        "- rent del <số hoặc tên nhóm>\n" +
        "- rent giahan <dd/mm/yyyy> [số | tên nhóm]"
      );
    }
  }
};
