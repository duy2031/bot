module.exports.config = {
  name: "tagadmin",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Tự động trả lời khi ai đó tag ADMIN BOT",
  commandCategory: "Tiện ích",
  usages: "Tự động",
  cooldowns: 0
};

module.exports.handleEvent = async function({ api, event }) {
  const { mentions, threadID } = event;

  if (!mentions || Object.keys(mentions).length === 0) return;

  const adminIDs = global.config.ADMINBOT || [];
  const taggedIDs = Object.keys(mentions);

  // Kiểm tra có tag ai là admin không
  const isAdminTagged = taggedIDs.some(uid => adminIDs.includes(uid));

  if (isAdminTagged) {
    return api.sendMessage("📌 Admin đang bận, xin vui lòng không làm phiền!", threadID);
  }
};

module.exports.run = () => {};
