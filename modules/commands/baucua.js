const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "baucua",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "duydz",
  description: "Game bầu cua nhiều người chơi",
  commandCategory: "game",
  usages: "baucua [cr|info|out|lắc]",
  cooldowns: 5,
};

const dataPath = __dirname + "/cache/baucua.json";
let rooms = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath)) : {};
const choices = ["tôm", "bầu", "cua", "cá", "gà", "nai"];

module.exports.handleEvent = async ({ api, event, Currencies }) => {
  const { threadID, senderID, body, messageID } = event;
  if (!body) return;
  const msg = body.toLowerCase().trim();

  // Bắt cược: ví dụ "bầu 1000" hoặc "cá 2000"
  const betMatch = msg.match(/^(tôm|bầu|cua|cá|gà|nai)\s+(\d+)$/i);
  if (!betMatch) return;

  const choice = betMatch[1].toLowerCase();
  const bet = parseInt(betMatch[2]);
  if (isNaN(bet) || bet < 1000)
    return api.sendMessage("Số tiền cược tối thiểu là 1000 đ!", threadID, messageID);

  const userMoney = (await Currencies.getData(senderID)).money;
  const room = rooms[threadID];
  if (!room)
    return api.sendMessage("Chưa có phòng bầu cua! Dùng 'baucua cr' để tạo phòng.", threadID, messageID);

  room.players = room.players || {};

  if (room.players[senderID]) {
    // Hoàn tiền cược cũ nếu cược lại
    const oldBets = room.players[senderID].bets;
    for (const k in oldBets) {
      await Currencies.increaseMoney(senderID, oldBets[k]);
    }
  }

  // Kiểm tra đủ tiền
  if (userMoney < bet)
    return api.sendMessage("Bạn không đủ tiền để cược số tiền này!", threadID, messageID);

  await Currencies.decreaseMoney(senderID, bet);

  room.players[senderID] = room.players[senderID] || { bets: {} };
  room.players[senderID].bets[choice] = (room.players[senderID].bets[choice] || 0) + bet;

  fs.writeFileSync(dataPath, JSON.stringify(rooms, null, 2));

  return api.sendMessage(
    `✅ Bạn đã cược: ${choice.toUpperCase()} - ${bet} đ!\n(Bạn có thể cược thêm hoặc đổi cược khác trước khi lắc)`,
    threadID,
    messageID
  );
};

module.exports.run = async ({ api, event, args, Currencies }) => {
  const { threadID, senderID, messageID } = event;
  const action = args[0];

  if (!action)
    return api.sendMessage("⚠️ Dùng: baucua [cr|info|out|lắc]", threadID, messageID);

  switch (action) {
    case "cr": {
      if (rooms[threadID])
        return api.sendMessage("Đã có phòng bầu cua trong nhóm này!", threadID, messageID);
      rooms[threadID] = { players: {} };
      fs.writeFileSync(dataPath, JSON.stringify(rooms, null, 2));
      return api.sendMessage(
        "✅ Tạo phòng bầu cua thành công!\nGửi 'bầu 1000' hoặc 'cá 2000' để cược!",
        threadID,
        messageID
      );
    }

    case "info": {
      const room = rooms[threadID];
      if (!room)
        return api.sendMessage("❌ Không có phòng bầu cua nào trong nhóm!", threadID, messageID);

      const players = room.players || {};
      let msg = "🎮 Danh sách người chơi đã cược:\n";
      for (const id in players) {
        const name = (await api.getUserInfo(id))[id].name;
        const bets = players[id].bets;
        msg += `- ${name}:\n`;
        for (const item in bets) {
          msg += `    • ${item.toUpperCase()}: ${bets[item]} đ\n`;
        }
      }
      return api.sendMessage(msg, threadID, messageID);
    }

    case "out": {
      const room = rooms[threadID];
      if (!room || !room.players[senderID])
        return api.sendMessage("❌ Bạn chưa tham gia phòng bầu cua!", threadID, messageID);

      // Hoàn tiền cược
      const bets = room.players[senderID].bets;
      for (const k in bets) {
        await Currencies.increaseMoney(senderID, bets[k]);
      }

      delete room.players[senderID];
      fs.writeFileSync(dataPath, JSON.stringify(rooms, null, 2));
      return api.sendMessage("✅ Bạn đã rời phòng và được hoàn lại tiền cược!", threadID, messageID);
    }

    case "lắc": {
      const room = rooms[threadID];
      if (!room)
        return api.sendMessage("❌ Không có phòng bầu cua trong nhóm!", threadID, messageID);

      if (Object.keys(room.players).length === 0)
        return api.sendMessage("⚠️ Không có ai cược trong phòng!", threadID, messageID);

      if (room.result)
        return api.sendMessage(
          "⚠️ Phòng đã lắc! Dùng 'baucua cr' để tạo lại nếu muốn chơi tiếp.",
          threadID,
          messageID
        );

      // Xúc xắc
      const xucxac = [
        choices[Math.floor(Math.random() * choices.length)],
        choices[Math.floor(Math.random() * choices.length)],
        choices[Math.floor(Math.random() * choices.length)],
      ];

      room.result = { faces: xucxac };
      fs.writeFileSync(dataPath, JSON.stringify(rooms, null, 2));

      await api.sendMessage("🎲 Đang lắc, đợi tí...", threadID);

      setTimeout(async () => {
        const faceCount = {};
        xucxac.forEach((f) => (faceCount[f] = (faceCount[f] || 0) + 1));

        const attachments = [];
        try {
          for (const face of xucxac) {
            const imgPath = path.join(__dirname, "cache/baucua", `${face}.jpg`);
            if (fs.existsSync(imgPath)) {
              attachments.push(fs.createReadStream(imgPath));
            }
          }
        } catch (e) {
          console.log("❌ Lỗi đọc ảnh:", e.message);
        }

        let msg = `🎲 Kết quả: ${xucxac.map((f) => f.toUpperCase()).join(" - ")}\n\n`;
        msg += "🎯 Danh sách người chơi và cược:\n";

        for (const id in room.players) {
          const name = (await api.getUserInfo(id))[id].name;
          const bets = room.players[id].bets;
          msg += `- ${name}:\n`;
          for (const item in bets) {
            msg += `    • ${item.toUpperCase()}: ${bets[item]} đ\n`;
          }
        }

        msg += `\n🎉 Kết quả trả thưởng:\n`;

        for (const id in room.players) {
          const name = (await api.getUserInfo(id))[id].name;
          const bets = room.players[id].bets;
          let totalWin = 0;
          for (const item in bets) {
            if (faceCount[item]) {
              totalWin += bets[item] * faceCount[item];
            }
          }
          if (totalWin > 0) {
            await Currencies.increaseMoney(id, totalWin);
            msg += `- ${name}: +${totalWin} đ\n`;
          } else {
            msg += `- ${name}: Thua sạch 😢\n`;
          }
        }

        delete rooms[threadID];
        fs.writeFileSync(dataPath, JSON.stringify(rooms, null, 2));
        return api.sendMessage({ body: msg, attachment: attachments }, threadID);
      }, 1500);
      break;
    }

    default:
      return api.sendMessage("⚠️ Lệnh không hợp lệ! Dùng: baucua [cr|info|out|lắc]", threadID, messageID);
  }
};
