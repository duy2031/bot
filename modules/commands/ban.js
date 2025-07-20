module.exports.config = {
  name: "ban",
  version: "2.1.0",
  hasPermssion: 3,
  credits: "GPT",
  description: "Ban hoặc unban người dùng hoặc nhóm (support reply/tag)",
  commandCategory: "Admin",
  usages: "ban [uid/@tag/reply] [lý do]\nuban [uid/@tag/reply]",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args, Users, Threads }) {
  const { threadID, messageID, senderID, mentions, type } = event;
  const command = args[0]?.toLowerCase();
  const isUnban = command === "uban";

  // Lấy ID mục tiêu
  let targetID, typeTarget = "user";

  if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else if (event.type === "message_reply") {
    targetID = event.messageReply.senderID;
  } else if (["user", "thread"].includes(args[1])) {
    targetID = args[2];
    typeTarget = args[1];
    args.splice(0, 3); // loại bỏ lệnh + type + id
  } else if (!isNaN(args[1])) {
    targetID = args[1];
    args.splice(0, 2); // loại bỏ lệnh + id
  } else {
    return api.sendMessage("❌ Không tìm thấy UID hoặc không có reply/tag!", threadID, messageID);
  }

  if (!targetID) return api.sendMessage("❌ Không xác định được ID cần ban/unban.", threadID, messageID);

  const reason = args.join(" ") || "Không có lý do";
  const date = new Date().toLocaleString("vi-VN");

  if (event.messageReply?.isGroup) typeTarget = "thread";
  else if (targetID === threadID) typeTarget = "thread";

  if (isUnban) {
    // UNBAN
    if (typeTarget === "user") {
      const data = (await Users.getData(targetID)).data || {};
      data.banned = 0;
      data.reason = null;
      data.dateAdded = null;
      await Users.setData(targetID, { data });
      global.data.userBanned.delete(targetID);
      return api.sendMessage(`✅ Đã gỡ ban người dùng ${targetID}`, threadID, messageID);
    } else {
      const data = (await Threads.getData(targetID)).data || {};
      data.banned = 0;
      data.reason = null;
      data.dateAdded = null;
      await Threads.setData(targetID, { data });
      global.data.threadBanned.delete(targetID);
      return api.sendMessage(`✅ Đã gỡ ban nhóm ${targetID}`, threadID, messageID);
    }
  } else {
    // BAN
    if (typeTarget === "user") {
      const data = (await Users.getData(targetID)).data || {};
      data.banned = 1;
      data.reason = reason;
      data.dateAdded = date;
      await Users.setData(targetID, { data });
      global.data.userBanned.set(targetID, { reason, dateAdded: date });
      return api.sendMessage(`❌ Đã ban người dùng ${targetID}\n📋 Lý do: ${reason}`, threadID, messageID);
    } else {
      const data = (await Threads.getData(targetID)).data || {};
      data.banned = 1;
      data.reason = reason;
      data.dateAdded = date;
      await Threads.setData(targetID, { data });
      global.data.threadBanned.set(targetID, { reason, dateAdded: date });
      return api.sendMessage(`❌ Đã ban nhóm ${targetID}\n📋 Lý do: ${reason}`, threadID, messageID);
    }
  }
};
