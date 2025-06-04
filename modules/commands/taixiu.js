const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "taixiu",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "duydz",
  description: "Tài xỉu nhiều người",
  commandCategory: "game",
  usages: "taixiu [cr|info|out|xổ]",
  cooldowns: 5,
};

const dataPath = __dirname + "/cache/taixiu.json";
let rooms = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath)) : {};

module.exports.handleEvent = async ({ api, event, Currencies }) => {
  const { threadID, senderID, body, messageID } = event;
  const msg = body.toLowerCase().trim();
  const betMatch = msg.match(/(tài|tai|xỉu|xiu)\s+(\d+)/i);

  if (betMatch) {
    const choice = betMatch[1].startsWith("tài") ? "tài" : "xỉu";
    const bet = parseInt(betMatch[2]);
    if (isNaN(bet) || bet < 1000) return api.sendMessage("Số tiền cược tối thiểu là 1000!", threadID, messageID);

    const userMoney = (await Currencies.getData(senderID)).money;
    const room = rooms[threadID];
    if (!room) return api.sendMessage("Chưa có phòng! Hãy dùng 'taixiu cr' để tạo phòng.", threadID, messageID);

    room.players = room.players || {};

    if (room.players[senderID]) {
      const oldBet = room.players[senderID].bet;
      await Currencies.increaseMoney(senderID, oldBet);
    }

    if (userMoney + (room.players[senderID]?.bet || 0) < bet)
      return api.sendMessage("Bạn không đủ tiền để cược số tiền này!", threadID, messageID);

    await Currencies.decreaseMoney(senderID, bet);

    room.players[senderID] = { choice, bet };
    fs.writeFileSync(dataPath, JSON.stringify(rooms, null, 2));

    return api.sendMessage(`✅ Đã đặt cược: ${choice.toUpperCase()} - ${bet}!\n(Bạn có thể đổi lại bất cứ lúc nào)`, threadID, messageID);
  }
};

module.exports.run = async ({ api, event, args, Currencies }) => {
  const { threadID, senderID, messageID } = event;
  const action = args[0];

  if (!action) return api.sendMessage("⚠️ Dùng: taixiu [cr|info|out|xổ]", threadID, messageID);

  switch (action) {
    case "cr": {
      if (rooms[threadID]) return api.sendMessage("Đã có phòng tài xỉu trong nhóm này!", threadID, messageID);
      rooms[threadID] = { players: {} };
      fs.writeFileSync(dataPath, JSON.stringify(rooms, null, 2));
      return api.sendMessage("✅ Tạo phòng tài xỉu thành công!\nGửi 'tài <tiền>' hoặc 'xỉu <tiền>' để tham gia!", threadID, messageID);
    }

    case "info": {
      const room = rooms[threadID];
      if (!room) return api.sendMessage("❌ Không có phòng tài xỉu nào trong nhóm!", threadID, messageID);
      const players = room.players || {};
      let msg = "🎮 Danh sách người chơi đã cược:\n";
      for (const id in players) {
        const name = (await api.getUserInfo(id))[id].name;
        msg += `- ${name}: ${players[id].choice.toUpperCase()} - ${players[id].bet} đ\n`;
      }
      return api.sendMessage(msg, threadID, messageID);
    }

    case "out": {
      const room = rooms[threadID];
      if (!room || !room.players[senderID]) return api.sendMessage("❌ Bạn chưa tham gia phòng tài xỉu!", threadID, messageID);
      const refund = room.players[senderID].bet;
      await Currencies.increaseMoney(senderID, refund);
      delete room.players[senderID];
      fs.writeFileSync(dataPath, JSON.stringify(rooms, null, 2));
      return api.sendMessage("✅ Bạn đã rời phòng và được hoàn lại tiền cược!", threadID, messageID);
    }

    case "xổ": {
      const room = rooms[threadID];
      if (!room) return api.sendMessage("❌ Không có phòng tài xỉu trong nhóm!", threadID, messageID);
      if (Object.keys(room.players).length === 0) return api.sendMessage("⚠️ Không có ai đặt cược trong phòng!", threadID, messageID);

      // Nếu đã xổ thì không cho xổ lại
      if (room.result) return api.sendMessage("⚠️ Phòng đã xổ rồi! Dùng 'taixiu cr' để tạo lại nếu muốn chơi tiếp.", threadID, messageID);

      // Xác định kết quả NGAY LẬP TỨC (tránh ping cao gây lệch)
      const num1 = Math.floor(Math.random() * 6) + 1;
      const num2 = Math.floor(Math.random() * 6) + 1;
      const num3 = Math.floor(Math.random() * 6) + 1;
      const total = num1 + num2 + num3;
      const result = total <= 10 ? "xỉu" : "tài";

      // Ghi lại kết quả để chống xổ lại
      room.result = { num1, num2, num3, total, result };
      fs.writeFileSync(dataPath, JSON.stringify(rooms, null, 2));

      await api.sendMessage("🎲 Đang xổ xúc xắc, vui lòng chờ trong giây lát...", threadID);

      setTimeout(async () => {
        const players = room.players;
        const attachments = [];

        try {
          attachments.push(fs.createReadStream(path.join(__dirname, "cache/dice", `${num1}.jpg`)));
          attachments.push(fs.createReadStream(path.join(__dirname, "cache/dice", `${num2}.jpg`)));
          attachments.push(fs.createReadStream(path.join(__dirname, "cache/dice", `${num3}.jpg`)));
        } catch (e) {
          console.log("❌ Lỗi đọc ảnh xúc xắc:", e.message);
        }

        let msg = `🎲 Kết quả: ${num1} + ${num2} + ${num3} = ${total} (${result.toUpperCase()})\n\n✅ Tài:\n`;
        for (const id in players) {
          if (players[id].choice === "tài") {
            const name = (await api.getUserInfo(id))[id].name;
            const { bet } = players[id];
            msg += `- ${name} ${result === "tài" ? `+${bet * 2}` : `-${bet}`}\n`;
          }
        }

        msg += `\n✅ Xỉu:\n`;
        for (const id in players) {
          if (players[id].choice === "xỉu") {
            const name = (await api.getUserInfo(id))[id].name;
            const { bet } = players[id];
            msg += `- ${name} ${result === "xỉu" ? `+${bet * 2}` : `-${bet}`}\n`;
          }
        }

        // Trả thưởng
        for (const id in players) {
          if (players[id].choice === result) {
            await Currencies.increaseMoney(id, players[id].bet * 2);
          }
        }

        delete rooms[threadID];
        fs.writeFileSync(dataPath, JSON.stringify(rooms, null, 2));

        return api.sendMessage({ body: msg, attachment: attachments }, threadID);
      }, 1500); // Delay 1.5s để mô phỏng "đang lắc"
      break;
    }
