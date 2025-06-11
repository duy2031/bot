const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const cron = require('node-cron');

const RENT_DATA_PATH = path.join(__dirname, 'module/commands/cache/data/thuebot.json');
const TIMEZONE = 'Asia/Ho_Chi_Minh';

let data = fs.existsSync(RENT_DATA_PATH) ? JSON.parse(fs.readFileSync(RENT_DATA_PATH, 'utf8')) : [];

const saveData = () => fs.writeFileSync(RENT_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
const formatDate = (dateString) => dateString.split('/').reverse().join('/');
const isInvalidDate = (dateString) => isNaN(new Date(dateString).getTime());

module.exports.config = {
    name: 'rent',
    version: '1.0.0',
    hasPermssion: 3,
    credits: 'DC-Nam',
    description: 'Cho thuê bot và quản lý thuê bot (Đã xóa phần đổi tên nhóm)',
    commandCategory: 'Hệ thống',
    usePrefix: false,
    usages: '/rent',
    cooldowns: 1
};

module.exports.run = async function ({ api, event, args }) {
    const send = (msg) => api.sendMessage(msg, event.threadID, event.messageID);
    const prefix = global.config.PREFIX;

    if (!global.config.ADMINBOT.includes(event.senderID)) return send('❎ Bạn không có quyền sử dụng lệnh này.');

    switch (args[0]) {
        case 'add':
            if (!args[1]) return send(`❎ Sai cú pháp\n${prefix}rent add id time_end`);
            let targetID = event.senderID;

            if (event.type === 'message_reply') {
                targetID = event.messageReply.senderID;
            } else if (Object.keys(event.mentions).length > 0) {
                targetID = Object.keys(event.mentions)[0];
            }

            let threadID = event.threadID;
            let startDate = moment.tz(TIMEZONE).format('DD/MM/YYYY');
            let endDate = args[1];

            if (args.length === 4 && !isNaN(args[1]) && !isNaN(args[2]) && args[3].match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
                threadID = args[1];
                targetID = args[2];
                endDate = args[3];
            } else if (args.length === 3 && !isNaN(args[1]) && args[2].match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
                targetID = args[1];
                endDate = args[2];
            }

            if (isNaN(targetID) || isNaN(threadID) || isInvalidDate(formatDate(startDate)) || isInvalidDate(formatDate(endDate))) return send('❎ Dữ liệu không hợp lệ');

            const isExists = data.find(e => e.t_id == threadID);
            if (isExists) return send('📝 Nhóm này đã được thuê bot rồi.');

            data.push({ t_id: threadID, id: targetID, time_start: startDate, time_end: endDate });
            saveData();

            send('✅ Thêm thuê bot thành công!');
            break;

        case 'check':
            const info = data.find(e => e.t_id === event.threadID);
            if (!info) return send('📝 Không có dữ liệu thuê bot cho nhóm này.');

            const daysLeft = Math.floor((new Date(formatDate(info.time_end)).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const hoursLeft = Math.floor(((new Date(formatDate(info.time_end)).getTime() - Date.now()) / (1000 * 60 * 60)) % 24);

            send({
                body: `👤 Người thuê: ${global.data.userName.get(info.id)}\n🔗 Link facebook: https://www.facebook.com/profile.php?id=${info.id}\n⏰ Bắt đầu: ${info.time_start}\n⏰ Kết thúc: ${info.time_end}\n\n⩺ Còn ${daysLeft} ngày ${hoursLeft} giờ là hết hạn`,
                attachment: [await streamURL(`https://graph.facebook.com/${info.id}/picture?width=512&height=512`)]
            });
            break;

        case 'list':
            if (data.length === 0) return send('📭 Hiện tại không có nhóm nào thuê bot.');

            send(`📃 Danh sách nhóm thuê bot:\n${data.map((item, index) => `━━━━━━━━━━━━━━━━━━━\n➤ ${index + 1}. ${global.data.userName.get(item.id)}\n➤ Trạng thái: ${(new Date(formatDate(item.time_end)).getTime() >= Date.now()) ? 'Còn hạn' : 'Đã hết hạn'}\n➤ Box name: ${(global.data.threadInfo.get(item.t_id) || {}).threadName}`).join('\n')}\n━━━━━━━━━━━━━━━━━━━\n➤ Reply [ del | out | giahan ] + stt để thực hiện hành động`, (err, info) => {
                info.config = module.exports.config;
                info.event = event;
                info.data = data;
                global.client.handleReply.push({ ...info, type: 'list' });
            });
            break;

        default:
            send({
                body: `[ HƯỚNG DẪN SỬ DỤNG ]\nDùng: ${prefix}rent add → Để thêm nhóm thuê bot\n${prefix}rent list → Để xem danh sách thuê bot\n𝗛𝗗𝗦𝗗 → ${prefix}rent check → Kiểm tra thời hạn của nhóm`,
                attachment: global.images.splice(0, 1)
            });
            break;
    }

    saveData();
};
