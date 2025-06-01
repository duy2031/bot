const fs = require("fs");

module.exports.config = {
  name: "taixiu",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "60fps",
  description: "Tài xỉu nhiều người",
  commandCategory: "game",
  usages: "tx [cr|info|out|xổ]",
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
    if (!room) return api.sendMessage("Chưa có phòng! Hãy dùng 'tx cr' để tạo phòng trước.", threadID, messageID);

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

  if (action === "cr") {
    if (rooms[threadID]) return api.sendMessage("Phòng đã tồn tại!", threadID, messageID);
    rooms[threadID] = { creator: senderID, players: {} };
    fs.writeFileSync(dataPath, JSON.stringify(rooms, null, 2));
    return api.sendMessage("✅ Phòng tài xỉu đã được tạo!\nNgười chơi chỉ cần nhắn: tài [tiền] hoặc xỉu [tiền] để tham gia.", threadID, messageID);
  }

  if (action === "info") {
    const room = rooms[threadID];
    if (!room) return api.sendMessage("Phòng chưa được tạo!", threadID, messageID);
    let msg = `🎮 Phòng tài xỉu:\n- Chủ phòng: ${(await api.getUserInfo(room.creator))[room.creator].name}`;
    if (!room.players || Object.keys(room.players).length === 0) msg += `\n- Chưa có người tham gia.`;
    else {
      msg += `\n- Người chơi:`;
      for (const id in room.players) {
        const name = (await api.getUserInfo(id))[id].name;
        const { choice, bet } = room.players[id];
        msg += `\n+ ${name}: ${choice.toUpperCase()} - ${bet}`;
      }
    }
    return api.sendMessage(msg, threadID, messageID);
  }

  if (action === "out") {
    const room = rooms[threadID];
    if (!room || !room.players?.[senderID])
      return api.sendMessage("Bạn chưa tham gia phòng!", threadID, messageID);

    // Hoàn tiền khi rời phòng
    await Currencies.increaseMoney(senderID, room.players[senderID].bet);
    delete room.players[senderID];
    fs.writeFileSync(dataPath, JSON.stringify(rooms, null, 2));
    return api.sendMessage("✅ Bạn đã rời phòng và được hoàn tiền!", threadID, messageID);
  }

  if (action === "xổ") {
    const room = rooms[threadID];
    if (!room) return api.sendMessage("Phòng chưa được tạo!", threadID, messageID);
    if (senderID !== room.creator) return api.sendMessage("Chỉ chủ phòng mới được xổ!", threadID, messageID);
    if (!room.players || Object.keys(room.players).length === 0)
      return api.sendMessage("Phòng chưa có người tham gia!", threadID, messageID);

    // Xổ 3 số random
    const num1 = Math.floor(Math.random() * 6) + 1;
    const num2 = Math.floor(Math.random() * 6) + 1;
    const num3 = Math.floor(Math.random() * 6) + 1;
    const total = num1 + num2 + num3;
    const result = total <= 10 ? "xỉu" : "tài";

    let winners = [], losers = [];
    for (const id in room.players) {
      if (room.players[id].choice === result) winners.push(id);
      else losers.push(id);
    }

    // Xử lý thưởng
    for (const id of winners) {
      await Currencies.increaseMoney(id, room.players[id].bet * 2);
    }

    // Kết quả
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
    return api.sendMessage(msg, threadID, messageID);
  }

  return api.sendMessage("Sai cú pháp! Dùng: tx [cr|info|xổ|out]", threadID, messageID);
};
