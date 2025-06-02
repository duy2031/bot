const fs = require("fs");

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
    if (!room) return api.sendMessage("Chưa có phòng! Hãy dùng 'taixiu cr' để tạo phòng .", threadID, messageID);

    room.players = room.players || {};

    // Nếu đã cược trước đó, hoàn tiền cũ
    if (room.players[senderID]) {
      const oldBet = room.players[senderID].bet;
      await Currencies.increaseMoney(senderID, oldBet);
    }

    // Kiểm tra đủ tiền cho cược mới
    if (userMoney + (room.players[senderID]?.bet || 0) < bet)
      return api.sendMessage("Bạn không đủ tiền để cược số tiền này!", threadID, messageID);

    // Trừ tiền mới
    await Currencies.decreaseMoney(senderID, bet);

    // Cập nhật thông tin cược
    room.players[senderID] = { choice, bet };
    fs.writeFileSync(dataPath, JSON.stringify(rooms, null, 2));

    return api.sendMessage(`✅ Đã đặt cược: ${choice.toUpperCase()} - ${bet}!\n(Bạn có thể đổi lại bất cứ lúc nào)`, threadID, messageID);
  }
};

module.exports.run = async ({ api, event, args, Currencies }) => {
  const { threadID, senderID, messageID } = event;
  const action = args[0];

  if1000));

    // Xổ 3 số random
    const num1 = Math.floor(Math.random() * 6) + 1;
    const num2 = Math.floor(Math.random() * 6) + 1;
    const num3 = Math.floor(Math.random() * 6) + 1;
    const total = num1 + num2 + num3;
    const result = total <= 10 ? "xỉu" : "tài";

    // Link ảnh xúc xắc
    const diceImages = {
      1: "https://i.imgur.com/Q3QfE4t.jpeg",
      2: "https://i.imgur.com/M3juJEW.jpeg",
      3: "https://i.imgur.com/Tn6tZeG.jpeg",
      4: "https://i.imgur.com/ZhOA9Ie.jpeg",
      5: "https://i.imgur.com/eQMdRmd.jpeg",
      6: "https://i.imgur.com/2GHAR0f.jpeg"
    };

    const attachments = [
      { url: diceImages[num1] },
      { url: diceImages[num2] },
      { url: diceImages[num3] }
    ];

    let winners = [], losers = [];
    for (const id in room.players) {
      if (room.players[id].choice === result) winners.push(id);
      else losers.push(id);
    }

    // Xử lý thưởng
    for (const id of winners) {
      await Currencies.increaseMoney(id, room.players[id].bet * 2);
    }

    // Kết quả tin nhắn
    let msg = `🎲 Kết quả: ${num1} + ${num2} + ${num3} = ${total} (${result.toUpperCase()})\n\n`;
    msg += `✅ Tài:\n`;
    for (const id in room.players) {
      if (room.players[id].choice === "tài") {
        const name = (await api.getUserInfo(id))[id].name;
        const { bet } = room.players[id];
        msg += `- ${name} ${result === "tài" ? `+${bet * 2}` : `-${bet}`}\n`;
      }
    }
    msg += `\n✅ Xỉu:\n`;
    for (const id in room.players) {
      if (room.players[id].choice === "xỉu") {
        const name = (await api.getUserInfo(id))[id].name;
        const { bet } = room.players[id];
        msg += `- ${name} ${result === "xỉu" ? `+${bet * 2}` : `-${bet}`}\n`;
      }
    }

    // Xóa phòng
    delete rooms[threadID];
    fs.writeFileSync(dataPath, JSON.stringify(rooms, null, 2));

    // Gửi kết quả kèm ảnh xúc xắc
    api.sendMessage(
      { body: msg, attachment: attachments },
      threadID
    );
  });
}
