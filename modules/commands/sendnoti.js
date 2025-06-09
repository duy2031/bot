const fs = require('fs');
const axios = require('axios');
const path = require('path');

module.exports.config = {
    name: "sendnoti",
    version: "1.0.1",
    hasPermssion: 3,
    credits: "Fix by ChatGPT",
    description: "Thông báo cho các nhóm",
    commandCategory: "Admin",
    usages: "sendnoti [nội dung]",
    cooldowns: 5,
};

let atmDir = [];

async function downloadFile(url, filename) {
    const filePath = path.join(__dirname, 'cache', filename);
    const writer = fs.createWriteStream(filePath);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
    });
}

async function getAtm(atm, body) {
    let msg = { body: body, attachment: [] };

    for (const eachAtm of atm) {
        try {
            const fileName = `${Date.now()}_${eachAtm.filename}`;
            const filePath = await downloadFile(eachAtm.url, fileName);
            msg.attachment.push(fs.createReadStream(filePath));
            atmDir.push(filePath);
        } catch (error) {
            console.error("Error downloading attachment:", error);
        }
    }

    return msg;
}

module.exports.handleReply = async function ({ api, event, handleReply, Users, Threads }) {
    const { threadID, messageID, senderID, body } = event;
    let name = await Users.getNameUser(senderID);
    switch (handleReply.type) {
        case "noti": {
            let text = `» Phản Hồi Từ User «\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n➜ Name: ${name}\nNhóm: ${(await Threads.getInfo(threadID)).threadName || "Unknow"}\n➜ Nội dung : ${body || "không nội dung"}\n▱▱▱▱▱▱▱▱▱▱▱▱▱\nReply để gửi lại thành viên`;

            if (event.attachments.length > 0) {
                text = await getAtm(event.attachments, text);
            }

            api.sendMessage(text, handleReply.threadID, async (err, info) => {
                if (err) console.error("Error sending message:", err);
                atmDir.forEach(file => fs.unlinkSync(file));
                atmDir = [];
                global.client.handleReply.push({
                    name: this.config.name,
                    type: "reply",
                    messageID: info.messageID,
                    messID: messageID,
                    threadID
                });
            });
            break;
        }
        case "reply": {
            let text = `» Phản Hồi Từ Admin «\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n\n➜ Name: ${name}\n➜ Nội dung : ${body}\n▱▱▱▱▱▱▱▱▱▱▱▱▱\nreply tin nhắn này để báo về admin`;

            if (event.attachments.length > 0) {
                text = await getAtm(event.attachments, text);
            }

            api.sendMessage(text, handleReply.threadID, async (err, info) => {
                if (err) console.error("Error sending message:", err);
                atmDir.forEach(file => fs.unlinkSync(file));
                atmDir = [];
                global.client.handleReply.push({
                    name: this.config.name,
                    type: "noti",
                    messageID: info.messageID,
                    threadID
                });
            }, handleReply.messID);
            break;
        }
    }
}

module.exports.run = async function ({ api, event, args, Users }) {
    const { threadID, messageID, senderID, messageReply } = event;
    if (!args[0]) return api.sendMessage("Vui lòng nhập nội dung thông báo!", threadID);

    let allThread = global.data.allThreadID || [];
    let canSend = 0, cannotSend = 0;

    let text = `📢 Thông báo từ Admin: ${await Users.getNameUser(senderID)}\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n\n✉️ Nội dung: ${args.join(" ")}\n▱▱▱▱▱▱▱▱▱▱▱▱▱\nReply để phản hồi lại Admin.`;

    if (event.type == "message_reply" && messageReply.attachments.length > 0) {
        text = await getAtm(messageReply.attachments, text);
    }

    for (const each of allThread) {
        try {
            await api.sendMessage(text, each);
            canSend++;
        } catch (err) {
            cannotSend++;
            console.error("Error sending message:", err);
        }
    }

    atmDir.forEach(file => {
        try {
            fs.unlinkSync(file);
        } catch (err) {
            console.error("Error deleting file:", err);
        }
    });

    atmDir = [];
    api.sendMessage(`✅ Đã gửi thành công đến ${canSend} nhóm!\n❌ Không thể gửi đến ${cannotSend} nhóm!`, threadID);
}
