module.exports.config = {
    name: "top",
    version: "1.0.5",
    hasPermssion: 0,
    credits: "JRT mod by Niiozic - Tích hợp bởi ChatGPT",
    description: "Xem các cấp độ của người dùng",
    commandCategory: "Thống kê",
    usages: "[thread/user/money/level]",
    cooldowns: 5
};

module.exports.handleReply = async o => {
    let { args, threadID: t, messageID: m, senderID: s, participantIDs: p } = o.event;
    let send = (msg, cb) => o.api.sendMessage(msg, t, cb, m);
    let currencies = await o.Currencies.getAll();

    switch (args[0]) {
        case '1':
            send(`NHỮNG NGƯỜI GIÀU NHẤT BOX\n\n${currencies.filter($ => p.includes($.userID + '')).sort((a, b) => BigInt(a.money) < BigInt(b.money) ? 0 : -1).slice(0, 15).map(($, i) => `${i + 1}. ${global.data.userName.get($.userID + '')}\n🎫 ${$.money.toLocaleString()}$`).join('\n')}\n\n⚠️ Nghiêm cấm buôn bán coin phát hiện ban vĩnh viễn, phát hiện báo admin sẽ được thưởng`);
            break;
        case '2':
            send(`NHỮNG NGƯỜI GIÀU NHẤT SEVER\n\n${currencies.sort((a, b) => BigInt(a.money) < BigInt(b.money) ? 0 : -1).slice(0, 15).map(($, i) => `${i + 1}. ${global.data.userName.get($.userID + '')}\n🎫 ${$.money.toLocaleString()}$`).join('\n')}\n\n⚠️ Nghiêm cấm buôn bán coin phát hiện ban vĩnh viễn, phát hiện báo admin sẽ được thưởng`);
            break;
        default:
            break;
    };
};

module.exports.run = async ({ event, api, args, Currencies, Users }) => {
    const { threadID: t, messageID: m, senderID: s, participantIDs: pI } = event;
    const allType = ["money", "level"];
    const moment = require("moment-timezone");
    const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");

    if (args.length == 0) return api.sendMessage(`[ Bạn có thể dùng ]\n\n${global.config.PREFIX}top money -> xem 15 người giàu nhất\n${global.config.PREFIX}top thread -> 15 nhóm lắm mồm nhất\n${global.config.PREFIX}top user -> những người nói nhiều nhất\n${global.config.PREFIX}top level -> Top 15 người dùng có level cao nhất sever\n=====「${timeNow}」=====`, t, m);

    let array = [], newArr = [], msg = "";

    const CC = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });
    const LV = (x) => Math.floor((Math.sqrt(1 + (4 * x) / 3) + 1) / 2);
    const VC = (k) => (a, b) => (a[k] > b[k] ? -1 : a[k] < b[k] ? 1 : 0);

    const FOD = async (key, key2) => {
        for (const id of pI) {
            let mU = (await Currencies.getData(id))[key] || 0;
            let nU = (await Users.getData(id)).name || "";
            array.push({ i: id, n: nU, [key2]: mU });
        }
    };

    const FO = (key) => {
        for (let i in array) {
            newArr.push({
                i: parseInt(i) + 1,
                id: array[i].i,
                n: array[i].n,
                [key]: array[i][key]
            });
        }
    };

    const FF = (t1, t2) => {
        for (let i in newArr) {
            msg += `${parseInt(i) + 1}. ${newArr[i].n}\n » ${t1}: ${t2 == "m" ? CC(newArr[i][t2]) : LV(newArr[i][t2])}\n\n`;
            if (i == 9) break; // Hiển thị tối đa 10 người
        }
    };

    const option = parseInt(args[1] || 10);
    if (isNaN(option) || option <= 0) option = 10;

    // Xem top Level
    if (args[0] == "level") {
        let all = await Currencies.getAll(['userID', 'exp']);
        all.sort((a, b) => b.exp - a.exp);
        let msg = '📊 Top 15 người dùng có level cao nhất sever 📊\n\n';
        for (let i = 0; i < Math.min(15, all.length); i++) {
            let level = LV(all[i].exp);
            let name = (await Users.getData(all[i].userID)).name;
            msg += `${i + 1}. ${name} - cấp ${level}\n`;
        }
        return api.sendMessage(msg, t, m);
    }

    // Xem top Thread (nhóm)
    if (args[0] == "thread") {
        let threadList = [];
        try {
            var data = await api.getThreadList(option + 10, null, ["INBOX"]);
        } catch (e) {
            console.log(e);
            return api.sendMessage("❌ Đã xảy ra lỗi khi lấy danh sách nhóm.", t, m);
        }

        for (const thread of data) {
            if (thread.isGroup == true) {
                threadList.push({
                    threadName: thread.name || "Không tên",
                    threadID: thread.threadID,
                    messageCount: thread.messageCount
                });
            }
        }

        threadList.sort((a, b) => b.messageCount - a.messageCount);

        let msg = `🔥 Top ${Math.min(option, threadList.length)} nhóm tương tác nhiều nhất 🔥\n\n`;
        for (let i = 0; i < Math.min(option, threadList.length); i++) {
            msg += `${i + 1}. ${threadList[i].threadName}\n🔗 TID: [${threadList[i].threadID}]\n💬 Số tin nhắn: ${threadList[i].messageCount} tin nhắn\n\n`;
        }

        return api.sendMessage(msg, t, m);
    }

    // Xem top Money
    if (args[0] == "money") {
        let send = (msg, cb) => api.sendMessage(msg, t, cb, m);
        return send(`[ Check Top Money Bot ]\n\n1. Top money trong box\n2. Top money toàn sever\n\nReply (phản hồi) theo số để xem top money`, (err, res) => {
            res.name = exports.config.name;
            global.client.handleReply.push(res);
        });
    }

    // Xem top User (tổng số tin nhắn)
    if (args[0] == "user") {
        await FOD('exp', 'm'); // Lấy exp (số tin nhắn) của từng user
        array.sort(VC('m'));
        FO('m');
        FF('Số tin nhắn', 'm');

        return api.sendMessage(`📈 Dưới đây là top ${Math.min(10, newArr.length)} người dùng lắm mồm nhất 📈\n\n${msg}`, t, m);
    }
};
