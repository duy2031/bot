const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");

const CACHE_PATH = path.join(__dirname, "thread_message_cache.json");

module.exports.config = {
    name: "top",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "JRT mod by Niiozic",
    description: "Thống kê nhóm hoạt động nhất trong tuần",
    commandCategory: "Thống kê",
    usages: "[thread/level]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args, Currencies, Users }) => {
    const { threadID: t, messageID: m } = event;
    const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");
    const day = moment.tz("Asia/Ho_Chi_Minh").day();

    if (args.length === 0)
        return api.sendMessage(
            `[ Lựa chọn thống kê ]\n\n${global.config.PREFIX}top thread → top nhóm hoạt động nhất tuần\n${global.config.PREFIX}top level → top người có cấp cao nhất\n=====「${timeNow}」=====`,
            t, m
        );

    const LV = (x) => Math.floor((Math.sqrt(1 + (4 * x) / 3) + 1) / 2);

    // Top level người dùng
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

    // Top nhóm tương tác trong tuần
    if (args[0] === "thread") {
        let cache = {};
        if (fs.existsSync(CACHE_PATH)) {
            cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
        }

        const now = moment.tz("Asia/Ho_Chi_Minh");
        const startOfWeek = now.clone().startOf('isoWeek'); // Thứ 2
        const endOfWeek = now.clone().endOf('isoWeek'); // Chủ nhật

        // Nếu đã hết tuần, reset cache
        if (now.isAfter(endOfWeek)) {
            cache = {};
            fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
        }

        let threadList = await api.getThreadList(100, null, ["INBOX"]);
        let result = [];

        for (const thread of threadList) {
            if (!thread.isGroup) continue;

            const tid = thread.threadID;
            const currentCount = thread.messageCount || 0;
            const oldCount = cache[tid] || currentCount;
            const weeklyCount = currentCount - oldCount;

            result.push({
                name: thread.name || "Không tên",
                id: tid,
                weeklyCount
            });

            // Lưu dữ liệu nếu chưa có
            if (!(tid in cache)) {
                cache[tid] = currentCount;
            }
        }

        // Ghi lại file cache
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));

        result.sort((a, b) => b.weeklyCount - a.weeklyCount);
        const top = result.slice(0, 10);

        let msg = `🔥 Top nhóm nói nhiều nhất tuần này🔥\n\n`;
        top.forEach((g, i) => {
            msg += `${i + 1}. ${g.name}\n💬 Tin nhắn trong tuần: ${g.weeklyCount}\n\n`;
        });

        return api.sendMessage(msg, t, m);
    }
};
