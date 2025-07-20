module.exports.config = {
  name: "bot",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "duydzai",
  description: "Phản hồi bằng nội dung đặt sẵn",
  commandCategory: "Tiện ích",
  usages: "bot",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event }) {
  // Đây là nội dung mà bạn muốn bot phản hồi
  const replyMessage = "yeu muoi vcl";

  // Gửi tin nhắn phản hồi
  return api.sendMessage(replyMessage, event.threadID, event.messageID);
};
