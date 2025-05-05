const fs = require('fs');
const path = __dirname + '/taixiuData.json';
const moneyPath = __dirname + '/money.json';

let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};
let userMoney = fs.existsSync(moneyPath) ? JSON.parse(fs.readFileSync(moneyPath)) : {};

function saveTX() {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function saveMoney() {
  fs.writeFileSync(moneyPath, JSON.stringify(userMoney, null, 2));
}

function getMoney(uid) {
  if (!userMoney[uid]) userMoney[uid] = { money: 0 };
  return userMoney[uid].money;
}

function truTien(uid, amount) {
  if (!userMoney[uid]) userMoney[uid] = { money: 0 };
  userMoney[uid].money -= amount;
  saveMoney();
}

function congTien(uid, amount) {
  if (!userMoney[uid]) userMoney[uid] = { money: 0 };
  userMoney[uid].money += amount;
  saveMoney();
}

function roll() {
  return Math.floor(Math.random() * 6) + 1;
}

const diceImages = {
  1: 'https://i.imgur.com/1Q9Z1Zm.png',
  2: 'https://i.imgur.com/7sI7u64.png',
  3: 'https://i.imgur.com/OdL0XPt.png',
  4: 'https://i.imgur.com/J1Og6cN.png',
  5: 'https://i.imgur.com/YHGkZnj.png',
  6: 'https://i.imgur.com/r9m1cWT.png',
};

module.exports.config = {
  name: 'tx',
  version: '3.0.0',
  hasPermssion: 0,
  credits: 'YourName + GPT',
  description: 'Tài xỉu có ví tiền + hình ảnh xúc xắc',
  commandCategory: 'game',
  usages: '/tx cr | /tx tài/xỉu [tiền] | /tx lac',
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const input = args[0];

  if (!input) return api.sendMessage('Dùng: /tx cr | /tx tài/xỉu [tiền] | /tx lac', threadID, messageID);

  // Tạo bàn
  if (input === 'cr') {
    if (data[threadID]) return api.sendMessage('Đã có bàn chơi. Hoàn tất trước khi tạo mới.', threadID, messageID);
    data[threadID] = {
      creator: senderID,
      players: {},
      created: Date.now()
    };
    saveTX();
    return api.sendMessage('Đã tạo bàn tài xỉu.\nDùng /tx tài|xỉu [tiền] để cược.', threadID, messageID);
  }

  // Đặt cược
  if (['tài', 'xỉu'].includes(input)) {
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 100) return api.sendMessage('Tiền cược không hợp lệ. Tối thiểu là 1000.', threadID, messageID);
    const game = data[threadID];
    if (!game) return api.sendMessage('Chưa có bàn chơi. Dùng /tx cr để tạo.', threadID, messageID);
    if (game.players[senderID]) return api.sendMessage('Bạn đã cược rồi.', threadID, messageID);

    const balance = getMoney(senderID);
    if (balance < amount) return api.sendMessage(Bạn không đủ tiền. Hiện có ${balance} xu., threadID, messageID);

    truTien(senderID, amount);

    game.players[senderID] = { choose: input, amount };
    saveTX();

    return api.sendMessage(Bạn đã cược ${amount} xu vào ${input.toUpperCase()}., threadID, messageID);
  }

  // Lắc xúc xắc
  if (input === 'lac') {
    const game = data[threadID];
    if (!game) return api.sendMessage('Không có bàn nào đang chơi.', threadID, messageID);
    if (game.creator !== senderID) return api.sendMessage('Chỉ người tạo bàn mới được lắc.', threadID, messageID);

    const x1 = roll(), x2 = roll(), x3 = roll();
    const total = x1 + x2 + x3;
    const result = total >= 11 ? 'tài' : 'xỉu';

    let winners = [], losers = [];

    for (const uid in game.players) {
      const p = game.players[uid];
      if (p.choose === result) winners.push(p);
      else losers.push(p);
    }

    const totalWin = winners.reduce((a, b) => a + b.amount, 0);
    const totalLose = losers.reduce((a, b) => a + b.amount, 0);

    let msg = Kết quả: ${x1} + ${x2} + ${x3} = ${total} => ${result.toUpperCase()}\n\n;

    if (winners.length === 0) {
      msg += 'Không ai thắng.\n';
    } else {
      msg += 'Người thắng:\n';
      for (const p of winners) {
        const payout = Math.floor((p.amount / totalWin) * totalLose) + p.amount;
        congTien(p.uid, payout);
        msg += + ${p.uid} nhận ${payout} xu\n;
      }
    }

    if (losers.length === 0) {
      msg += '\nKhông ai thua.';
    } else {
      msg += '\nNgười thua:\n';
      for (const p of losers) {
        msg += - ${p.uid} mất ${p.amount} xu\n;
      }
    }

    delete data[threadID];
    saveTX();

    return api.sendMessage({
      body: msg,
      attachment: await Promise.all([
        global.utils.getStreamFromURL(diceImages[x1]),
        global.utils.getStreamFromURL(diceImages[x2]),
        global.utils.getStreamFromURL(diceImages[x3])
      ])
    }, threadID, messageID);
  }

  return api.sendMessage('Sai cú pháp. Dùng /tx cr, /tx tài/xỉu [tiền], hoặc /tx lac.', threadID, messageID);
};
