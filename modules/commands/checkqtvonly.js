// checkQtvOnly.js
const { readFileSync } = require('fs-extra');
const { resolve } = require("path");

module.exports = async function({ api, event }) {
    const { threadID, senderID, messageID } = event;
    const pathData = resolve(__dirname, 'cache', 'qtvonly.json'); // chỉnh lại nếu bạn để file cache chỗ khác
    let database;
    try {
        database = JSON.parse(readFileSync(pathData));
    } catch (err) {
        console.error("❌ Lỗi đọc file qtvonly.json:", err);
        return true; // không chặn, tránh crash bot
    }
    const { qtvbox } = database;

    if (qtvbox[threadID]) {
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            const isQtv = threadInfo.adminIDs.some(item => item.id == senderID);
            if (!isQtv) {
                api.sendMessage("⚠️ Chỉ Quản trị viên nhóm hoặc Admin bot mới có thể sử dụng bot trong nhóm này.!", threadID, messageID);
                return false; // chặn lệnh
            }
        } catch (e) {
            console.error("❌ Lỗi khi kiểm tra QTV:", e);
            return true; // không chặn, tránh crash
        }
    }

    return true; // không chặn, cho phép tiếp tục
};
