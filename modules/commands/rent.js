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
const isInvalidDate = dateStr => isNaN(new Date(dateStr).getTime());

module.exports.config = {
  name: "rent",
  version: "1.0.1",
  hasPermission: 3,
  credits: "NTK (edit by bạn)",
  description: "Quản lý thuê bot theo nhóm",
  commandCategory: "admin",
  usePrefix: false,
  usages: "",
  cooldowns: 1,
};

module.exports.run = async function({ api, event, args, users }) {
  const sendMessage = (msg) => api.sendMessage(msg, event.threadID, event.messageID);
  const ADMINBOT = global.config.ADMINBOT;

  if (!ADMINBOT.includes(event.senderID)) return sendMessage("Bạn không có quyền sử dụng lệnh này!");

  switch (args[0]) {
    case "add": {
      let threadID = args[1] || event.threadID;
      let userID = args[2] || event.senderID;
      let time_end = args[3];

      if (!threadID || !userID || !time_end) {
        return sendMessage("Cách dùng: rent add <threadID> <userID> <dd/mm/yyyy>");
      }

      if (isInvalidDate(formatDate(time_end))) return sendMessage("❌ Ngày không hợp lệ!");

      if (data.some(e => e.t_id === threadID)) return sendMessage("❌ Nhóm này đã thuê bot rồi!");

      const time_start = moment.tz(TIMEZONE).format('DD/MM/YYYY');
      data.push({ t_id: threadID, id: userID, time_start, time_end });

      saveData();
      return sendMessage(`✅ Đã thêm thuê bot cho nhóm ${threadID} đến ngày ${time_end}`);
    }

    case "info": {
      let info = data.find(e => e.t_id === event.threadID);
      if (!info) return sendMessage("❌ Nhóm này chưa thuê bot.");

      let end = new Date(formatDate(info.time_end)).getTime();
      let now = Date.now();
      let days = Math.floor((end - now) / (1000 * 60 * 60 * 24));
      let hours = Math.floor(((end - now) / (1000 * 60 * 60)) % 24);

      return sendMessage(`📄 Thuê bot bởi ID: ${info.id}\n📆 Bắt đầu: ${info.time_start}\n⏰ Kết thúc: ${info.time_end}\n⏳ Còn lại: ${days} ngày ${hours} giờ`);
    }

    case "list": {
      if (data.length === 0) return sendMessage("📭 Danh sách thuê bot trống.");

      let msg = "📋 Danh sách nhóm thuê bot:\n";
      data.forEach((e, i) => {
        let status = (new Date(formatDate(e.time_end)).getTime() >= Date.now()) ? "✅ Còn hạn" : "⛔ Hết hạn";
        msg += `\n${i + 1}. Nhóm ${e.t_id} - ${status}\n→ Người thuê: ${e.id}\n→ Hết hạn: ${e.time_end}`;
      });

      return sendMessage(msg);
    }

    default: {
      return sendMessage("🔧 Hướng dẫn:\n- rent add <threadID> <userID> <dd/mm/yyyy>\n- rent info\n- rent list");
    }
  }
};
