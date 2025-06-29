const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "scl",
  version: "1.0",
  hasPermssion: 0,
  credits: "gấu lỏ",
  description: "Tìm và tải nhạc SoundCloud, sau đó gửi video đến tất cả nhóm",
  commandCategory: "tiện ích",
  usages: "[tên bài hát]",
  cooldowns: 5
};

const CLIENT_ID = "3sN94fvc9AjpzCe1QvVlD3mFwKfucCeC";

module.exports.run = async ({ api, event, args }) => {
  const query = args.join(" ");
  if (!query) return api.sendMessage("❗ Nhập tên bài hát để tìm.", event.threadID, event.messageID);

  try {
    const { data } = await axios.get("https://api-v2.soundcloud.com/search", {
      params: { q: query, client_id: CLIENT_ID, limit: 6 },
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const results = data.collection.filter(track => track.media && Array.isArray(track.media.transcodings));
    if (!results.length) return api.sendMessage("❌ Không tìm thấy bài nào có thể tải MP3.", event.threadID, event.messageID);

    const msg = results.map((t, i) => `${i + 1}. ${t.title} - ${t.user.username}`).join("\n") + "\n\n📌 Reply số bài để tải MP3";
    api.sendMessage(msg, event.threadID, (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: event.senderID,
        tracks: results
      });
    }, event.messageID);
  } catch {
    api.sendMessage("⚠️ Lỗi khi tìm kiếm bài hát.", event.threadID, event.messageID);
  }
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  if (event.senderID !== handleReply.author) return;

  try {
    const index = parseInt(event.body);
    const track = handleReply.tracks[index - 1];

    if (!track || !track.media || !Array.isArray(track.media.transcodings)) {
      return api.sendMessage("❌ Bài hát không có định dạng tải được.", event.threadID, event.messageID);
    }

    const prog = track.media.transcodings.find(t => t.format.protocol === "progressive");
    if (!prog) return api.sendMessage("❌ Không tìm thấy link MP3 phù hợp.", event.threadID, event.messageID);

    const { data } = await axios.get(prog.url, {
      params: { client_id: CLIENT_ID }
    });

    const filePath = path.join(__dirname, "cache", `${Date.now()}.mp3`);
    const writer = fs.createWriteStream(filePath);
    const stream = await axios({ url: data.url, method: "GET", responseType: "stream" });

    stream.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage({
        body: `🎵 ${track.title}\n👤 ${track.user.username}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => {
        fs.unlinkSync(filePath);
        api.unsendMessage(handleReply.messageID);
        Scl(api);
      }, event.messageID);
    });

  } catch (err) {
    console.error("❌ Lỗi khi tải MP3:", err);
    api.sendMessage("⚠️ Không thể tải MP3.", event.threadID, event.messageID);
  }
};


