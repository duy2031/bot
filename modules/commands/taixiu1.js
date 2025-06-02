const fs = require("fs");

module.exports.config = {
  name: "taixiu1",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "duydz",
  description: " tài xỉu ",
  commandCategory: "game",
  usages: "[tài|xỉu] [tiền cược]",
  cooldowns: 5,
};

module.exports.run = async ({ api, event, args, Currencies }) => {
  const { threadID, senderID, messageID } = event;
  const choice = args[0]?.toLowerCase();
  const bet = parseInt(args[1]);

  if (!["tài", "xỉu"].includes(choice) || isNaN(bet) || bet < 1000) {
    return api.sendMessage(
      "Sai cú pháp hoặc tiền cược quá thấp!\nDùng: tài/xỉu [số tiền] (tối thiểu 1000).",
      threadID,
      messageID
    );
  }

  const userMoney = (await Currencies.getData(senderID)).money;
  if (userMoney < bet) {
    return api.sendMessage("Bạn không đủ tiền để cược!", threadID, messageID);
  }

  // Trừ tiền cược trước
  await Currencies.decreaseMoney(senderID, bet);

  // Gửi thông báo "Đang xổ xúc xắc..."
  api.sendMessage("🎲 Đang xổ xúc xắc... Vui lòng đợi trong giây lát!", threadID, async () => {
    // Delay 2 giây
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Xổ xúc xắc
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

    let msg = `🎲 Kết quả: ${num1} + ${num2} + ${num3} = ${total} (${result.toUpperCase()})\n`;

    if (choice === result) {
      const winAmount = bet * 2;
      await Currencies.increaseMoney(senderID, winAmount);
      msg += `✅ Bạn đã thắng! Nhận được ${winAmount}.\n`;
    } else {
      msg += `❌ Bạn đã thua mất ${bet}.\n`;
    }

    return api.sendMessage(
      { body: msg, attachment: attachments },
      threadID,
      messageID
    );
  });
};
