const fs = require('fs');
const path = __dirname + '/taixiuData.json';
const moneyPath = __dirname + '/money.json';

let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};
let money = fs.existsSync(moneyPath) ? JSON.parse(fs.readFileSync(moneyPath)) : {};

function saveTX() {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}
function saveMoney() {
  fs.writeFileSync(moneyPath, JSON.stringify(money, null, 2));
}
function getMoney(uid) {
  if (!money[uid]) money[uid] = { money: 0 };
  return money[uid].money;
}
function truTien(uid, amount) {
  if (!money[uid]) money[uid] = { money: 0 };
  money[uid].money -= amount;
  saveMoney();
}
function congTien(uid, amount) {
  if (!money[uid]) money[uid] = { money: 0 };
  money[uid].money += amount;
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
  version: '3.1.0',
  hasPermssion: 0,
  credits: 'pduy',
  description: 'Game tài xỉu ',
  commandCategory: 'game',
  usages: '/tx cr | /tx tài/xỉu [số tiền] | /tx lac',
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const input = args[0];

  if (!input) return api.sendMessage('Dùng: /tx cr | /tx tài/xỉu [số tiền] | /tx lac', threadID, messageID);

  // Tạo bàn
  if (input === 'cr') {
    if (data[threadID]) return api.sendMessage('Bàn đã tồn tại. Dùng /tx lac để kết thúc.', threadID, messageID);
    data[threadID] = { creator: senderID, players: {} };
    saveTX();
    return api.sendMessage('Đã tạo bàn tài xỉu!\nDùng /tx tài|xỉu [số tiền] để đặt cược.', threadID, messageID);
  }

  // Đặt cược
  if (['tài', 'xỉu'].includes(input)) {
    const amount = parseInt(args[1]);
    if (!amount || amount < 100) return api.sendMessage('Số tiền cược phải từ 100 trở lên.', threadID, messageID);
    if (!data[threadID]) return api.sendMessage('Chưa có bàn nào. Dùng /tx cr để tạo.', threadID, messageID);
    if (data[threadID].players[senderID]) return api.sendMessage('Bạn đã cược rồi!', threadID, messageID);

    const balance = getMoney(senderID);
    if (balance < amount) return api.sendMessage(Bạn không đủ tiền. Hiện có: ${balance} xu., threadID, messageID);

    truTien(senderID, amount);
    data[threadID].players[senderID] = { bet: input, amount };
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
      if (p.bet === result) {
        winners.push({ uid, amount: p.amount });
        congTien(uid, p.amount * 2);
      } else {
        losers.push({ uid, amount: p.amount });
      }
    }

    let msg = Kết quả: ${x1} + ${x2} + ${x3} = ${total} => ${result.toUpperCase()}\n\n;

    if (winners.length) {
      msg += 'Thắng:\n' + winners.map(p => + ${p.uid}: +${p.amount * 2} xu).join('\n') + '\n';
    } else msg += 'Không ai thắng.\n';

    if (losers.length) {
      msg += '\nThua:\n' + losers.map(p => - ${p.uid}: -${p.amount} xu).join('\n');
    } else msg += '\nKhông ai thua.';

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

  return api.sendMessage('Sai cú pháp. Dùng /tx cr | /tx tài/xỉu [tiền] | /tx lac', threadID, messageID);
};
