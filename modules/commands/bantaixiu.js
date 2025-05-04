exports.config = {
  name: 'tx',
  version: '1.0.0',
  hasPermssion: 0,
  credits: 'DC-Nam (modified)',
  description: 'Chơi tài xỉu trong nhóm',
  commandCategory: 'Trò chơi',
  usages: '/tx cr để tạo bàn',
  cooldowns: 3,
};

const fs = require('fs');
const path = __dirname + '/cache/data/status-hack.json';
let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};
fs.writeFileSync(path, JSON.stringify(data));

let gameData = global.data_command_tx = global.data_command_tx || {};
if (!gameData.cooldown) {
  gameData.cooldown = {};
  gameData.timer = setInterval(() => {
    for (let uid in gameData.cooldown) {
      if (gameData.cooldown[uid] <= Date.now()) delete gameData.cooldown[uid];
    }
  }, 1000);
}

const units = {
  k: 12, m: 15, b: 18,
  kb: 21, mb: 24, gb: 27, g: 36,
};
const diceImgs = [
  "https://i.imgur.com/Q3QfE4t.jpeg",
  "https://i.imgur.com/M3juJEW.jpeg",
  "https://i.imgur.com/Tn6tZeG.jpeg",
  "https://i.imgur.com/ZhOA9Ie.jpeg",
  "https://i.imgur.com/eQMdRmd.jpeg",
  "https://i.imgur.com/2GHAR0f.jpeg"
];

exports.run = async function({ api, event, args, Currencies }) {
  const { threadID, senderID } = event;
  const send = msg => api.sendMessage(msg, threadID);

  const cmd = args[0]?.toLowerCase();
  const room = gameData[threadID];

  if (cmd === 'cr') {
    if (room) return send('❎ Nhóm đã có bàn tài xỉu!');
    if (gameData.cooldown[senderID]) return send('⏳ Vui lòng đợi để tạo bàn mới!');

    gameData.cooldown[senderID] = Date.now() + 5 * 60 * 1000;
    gameData[threadID] = {
      author: senderID,
      players: [],
      timeout: setTimeout(() => {
        delete gameData[threadID];
        send('⛔ Hết 5 phút không lắc, hủy bàn!');
      }, 5 * 60 * 1000)
    };
    return send('✅ Bàn tài xỉu đã tạo!\nGõ tài/xỉu + số tiền để cược');
  }

  if (!room) return;

  const input = args[0]?.toLowerCase();
  const betInput = args[1];
  const players = room.players;

  const getMoney = async id => (await Currencies.getData(id))?.money;
  const parseBet = async (input) => {
    if (!input) return false;
    if (/^(allin|all)$/i.test(input)) return BigInt(await getMoney(senderID));
    if (/^\d+%$/.test(input)) {
      const percent = parseInt(input);
      return BigInt(await getMoney(senderID)) * BigInt(percent) / BigInt(100);
    }
    const unit = Object.entries(units).find(([k]) => new RegExp(`^\\d+${k}$`).test(input));
    if (unit) return BigInt(input.replace(unit[0], '0'.repeat(unit[1])));
    if (/^\d+$/.test(input)) return BigInt(input);
    return false;
  };

  if (['tài', 'xỉu', 'tai', 'xiu', 't', 'x'].includes(input)) {
    const side = /^(tài|tai|t)$/i.test(input) ? 't' : 'x';
    const bet = await parseBet(betInput);
    if (!bet || bet < 50n) return send('❎ Tiền cược không hợp lệ (>= 50)');
    if (bet > await getMoney(senderID)) return send('❎ Bạn không đủ tiền');

    const existing = players.find(p => p.id === senderID);
    if (existing) {
      existing.select = side;
      existing.bet = bet;
      return send(`♻️ Đã cập nhật cược: ${side} - ${bet.toLocaleString()}$`);
    } else {
      players.push({ id: senderID, select: side, bet });
      return send(`✅ Cược thành công: ${side} - ${bet.toLocaleString()}$`);
    }
  }

  if (input === 'rời') {
    const index = players.findIndex(p => p.id === senderID);
    if (index === -1) return send('❎ Bạn chưa tham gia bàn');
    if (senderID === room.author) {
      clearTimeout(room.timeout);
      delete gameData[threadID];
      return send('✅ Chủ bàn rời, bàn bị hủy');
    }
    players.splice(index, 1);
    return send('✅ Bạn đã rời bàn');
  }

  if (input === 'info') {
    const names = await Promise.all(players.map(p => global.data.userName.get(p.id)));
    const list = players.map((p, i) => `${i + 1}. ${names[i]} cược ${p.bet.toLocaleString()}$ (${p.select})`).join('\n');
    const owner = global.data.userName.get(room.author);
    return send(`🎲 Tổng ${players.length} người:\n${list}\n\nChủ bàn: ${owner}`);
  }

  if (input === 'lắc') {
    if (senderID !== room.author) return send('❎ Bạn không phải chủ bàn!');
    if (players.length === 0) return send('❎ Chưa có ai cược!');

    room.playing = true;
    const msg = await send('🎲 Lắc xúc xắc...');
    await new Promise(r => setTimeout(r, 3000));
    api.unsendMessage(msg.messageID);

    const dices = [1, 2, 3].map(() => Math.floor(Math.random() * 6) + 1);
    const sum = dices.reduce((a, b) => a + b, 0);
    const win = sum > 10 ? 't' : 'x';

    const winners = players.filter(p => p.select === win);
    const losers = players.filter(p => p.select !== win);

    for (const p of winners) await Currencies.increaseMoney(p.id, p.bet.toString());
    for (const p of losers) await Currencies.decreaseMoney(p.id, p.bet.toString());

    const imgs = dices.map(num => diceImgs[num - 1]);

    send({
      body: `🎲 Kết quả: ${dices.join(', ')} = ${sum} (${win === 't' ? 'Tài' : 'Xỉu'})\n` +
        `✅ Thắng:\n${winners.map(p => `${global.data.userName.get(p.id)} +${p.bet.toLocaleString()}$`).join('\n')}\n` +
        `❌ Thua:\n${losers.map(p => `${global.data.userName.get(p.id)} -${p.bet.toLocaleString()}$`).join('\n')}`,
      attachment: await Promise.all(imgs.map(url => require('axios').get(url, { responseType: 'stream' }).then(res => res.data)))
    });

    clearTimeout(room.timeout);
    delete gameData[threadID];
  }
};
