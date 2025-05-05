module.exports.run = async function ({ event, args, api, Users }) {
  const { threadID, senderID, messageID } = event;
  const input = args[0];

  if (!input) return api.sendMessage('Dùng: /tx cr để tạo bàn | /tx tài|xỉu [tiền] để cược | /tx lac để lắc', threadID, messageID);

  // Tạo bàn
  if (input === 'cr') {
    if (data[threadID]) return api.sendMessage('Đã có bàn chơi trong box. Hoàn tất trước khi tạo mới.', threadID, messageID);

    data[threadID] = {
      creator: senderID,
      betTime: Date.now(),
      players: {}
    };
    saveData();
    return api.sendMessage('Tạo bàn tài xỉu thành công!\nDùng: /tx tài|xỉu [tiền] để cược.', threadID, messageID);
  }

  // Đặt cược
  if (['tài', 'xỉu'].includes(input)) {
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 100) return api.sendMessage('Tiền cược không hợp lệ. Tối thiểu là 1000.', threadID, messageID);

    const game = data[threadID];
    if (!game) return api.sendMessage('Chưa có bàn chơi. Dùng /tx cr để tạo bàn.', threadID, messageID);
    if (game.players[senderID]) return api.sendMessage('Bạn đã cược rồi.', threadID, messageID);

    game.players[senderID] = { choose: input, amount };
    saveData();

    return api.sendMessage(Bạn đã cược ${amount} xu vào "${input.toUpperCase()}"., threadID, messageID);
  }

  // Lệnh /tx lac để lắc xúc xắc
  if (input === 'lac') {
    const game = data[threadID];
    if (!game) return api.sendMessage('Không có bàn nào đang chơi.', threadID, messageID);
    if (game.creator !== senderID) return api.sendMessage('Chỉ người tạo bàn mới được lắc.', threadID, messageID);

    const dice = [roll(), roll(), roll()];
    const total = dice.reduce((a, b) => a + b, 0);
    const result = total >= 11 ? 'tài' : 'xỉu';

    // Tính kết quả
    let msg = Kết quả: ${dice.join(', ')} => Tổng ${total} => ${result.toUpperCase()}\n\n;
    let winners = [], losers = [];

    for (const uid in game.players) {
      const player = game.players[uid];
      if (player.choose === result) {
        winners.push({ uid, amount: player.amount });
      } else {
        losers.push({ uid, amount: player.amount });
      }
    }

    const totalWin = winners.reduce((sum, p) => sum + p.amount, 0);
    const totalLose = losers.reduce((sum, p) => sum + p.amount, 0);

    msg += Người thắng:\n;
    if (winners.length === 0) msg += 'Không ai thắng.\n';
    else {
      for (const p of winners) {
        const share = Math.floor((p.amount / totalWin) * totalLose); // chia đều theo tỉ lệ
        msg += + ${p.uid} thắng ${share + p.amount} xu\n;
      }
    }

    msg += \nNgười thua:\n;
    if (losers.length === 0) msg += 'Không ai thua.';
    else {
      for (const p of losers) {
        msg += - ${p.uid} thua ${p.amount} xu\n;
      }
    }

    delete data[threadID];
    saveData();

    return api.sendMessage(msg, threadID, messageID);
  }

  return api.sendMessage('Sai cú pháp. Dùng /tx cr, /tx tài/xỉu [tiền], hoặc /tx lac.', threadID, messageID);
};

// Hàm tung xúc xắc (1-6)
function roll() {
  return Math.floor(Math.random() * 6) + 1;
}
