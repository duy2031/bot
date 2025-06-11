module.exports.config = {
  name: "thuebot",
  version: "1.0.1",
  hasPermission: 2,
  credits: "NiioTeam",
  description: "Cho thuê bot",
  commandCategory: "Hệ thống",
  usages: "",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args, Users, Threads }) {
  const fs = require("fs-extra");
  const path = require("path");
  const moment = require("moment-timezone");
  const threadID = event.threadID;
  const senderID = event.senderID;
  const msg = args.join(" ");

  const rentalFile = path.join(__dirname, "cache", "data", "thuebot.json");
  if (!fs.existsSync(rentalFile)) fs.writeFileSync(rentalFile, "[]");
  const rentals = JSON.parse(fs.readFileSync(rentalFile));

  function saveRentals() {
    fs.writeFileSync(rentalFile, JSON.stringify(rentals, null, 2));
  }

  function formatTime(timestamp) {
    return moment(timestamp).tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
  }

  if (args[0] == "add") {
    if (!args[1] || !args[2]) return api.sendMessage("Vui lòng nhập đúng định dạng: thuebot add <threadID> <số ngày>", threadID);
    const groupID = args[1];
    const days = parseInt(args[2]);
    if (isNaN(days)) return api.sendMessage("Số ngày không hợp lệ.", threadID);
    const expireTime = Date.now() + days * 24 * 60 * 60 * 1000;
    const existingRental = rentals.find(r => r.threadID == groupID);
    if (existingRental) return api.sendMessage("Nhóm này đã được thuê bot.", threadID);
    rentals.push({ threadID: groupID, expireTime });
    saveRentals();
    api.sendMessage(`Đã thêm nhóm ${groupID} thuê bot đến ${formatTime(expireTime)}`, threadID);
  } else if (args[0] == "check") {
    const rental = rentals.find(r => r.threadID == threadID);
    if (rental) {
      api.sendMessage(`Nhóm này đã thuê bot đến ${formatTime(rental.expireTime)}`, threadID);
    } else {
      api.sendMessage("Nhóm này chưa thuê bot.", threadID);
    }
  } else if (args[0] == "list") {
    if (rentals.length == 0) return api.sendMessage("Hiện tại không có nhóm nào thuê bot.", threadID);
    const page = parseInt(args[1]) || 1;
    const limit = 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    const list = rentals.slice(start, end).map((r, i) => `${start + i + 1}. ${r.threadID} | ${formatTime(r.expireTime)}`).join("\n");
    api.sendMessage(`Danh sách nhóm thuê bot (Trang ${page}):\n${list}\n\nReply số thứ tự để xóa nhóm, thêm 'giahan' để gia hạn, thêm 'out' để bot out nhóm.`, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        type: "manage",
        page
      });
    });
  } else {
    api.sendMessage("Sử dụng:\n- thuebot add <threadID> <số ngày>\n- thuebot check\n- thuebot list [trang]", threadID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const fs = require("fs-extra");
  const path = require("path");
  const moment = require("moment-timezone");
  const threadID = event.threadID;
  const senderID = event.senderID;

  const rentalFile = path.join(__dirname, "cache", "data", "thuebot.json");
  const rentals = JSON.parse(fs.readFileSync(rentalFile));

  function saveRentals() {
    fs.writeFileSync(rentalFile, JSON.stringify(rentals, null, 2));
  }

  function formatTime(timestamp) {
    return moment(timestamp).tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
  }

  const input = event.body.trim();
  const [indexStr, action, dayStr] = input.split(" ");
  const index = parseInt(indexStr) - 1 + (handleReply.page - 1) * 10;

  if (isNaN(index) || index < 0 || index >= rentals.length) return api.sendMessage("Số thứ tự không hợp lệ.", threadID);

  const rental = rentals[index];

  if (action === "giahan") {
    const days = parseInt(dayStr);
    if (isNaN(days)) return api.sendMessage("Số ngày gia hạn không hợp lệ.", threadID);
    rental.expireTime += days * 24 * 60 * 60 * 1000;
    saveRentals();
    api.sendMessage(`Đã gia hạn nhóm ${rental.threadID} đến ${formatTime(rental.expireTime)}`, threadID);
  } else if (action === "out") {
    try {
      await api.removeUserFromGroup(api.getCurrentUserID(), rental.threadID);
      api.sendMessage(`Đã out khỏi nhóm ${rental.threadID}`, threadID);
    } catch (e) {
      api.sendMessage(`Không thể out khỏi nhóm ${rental.threadID}: ${e.message}`, threadID);
    }
  } else {
    rentals.splice(index, 1);
    saveRentals();
    api.sendMessage(`Đã xóa nhóm ${rental.threadID} khỏi danh sách thuê.`, threadID);
  }
};
