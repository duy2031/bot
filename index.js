const { spawn } = require("child_process");
const { readFileSync } = require("fs-extra");
const http = require("http");
const semver = require("semver");
const logger = require("./utils/log");
const path = require('path');

///////////////////////////////////////////////////////////
//========= Tạo website cho uptime giám sát =============//
///////////////////////////////////////////////////////////
const PORT = process.env.PORT || 2025;
const express = require("express");
const app = express();

// Route ping cho UptimeRobot hoặc monitor
app.get('/ping', (req, res) => {
    const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    console.log(`[ UPTIME PING ] Bot được ping lúc ${time}`);
    res.status(200).send('OK');
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`[ SYSTEM ] Máy chủ đang chạy tại cổng: ${PORT}`);
});

///////////////////////////////////////////////////////////
//======================== KHỞI ĐỘNG BOT ================//
///////////////////////////////////////////////////////////
function startBot(message) {
    if (message) logger(message, "BOT STARTING");

    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "main.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", async (codeExit) => {
        var x = `${codeExit}`;
        if (codeExit == 1) return startBot("Đang khởi động lại, vui lòng chờ...");
        else if (x.indexOf("2") == 0) {
            await new Promise(resolve => setTimeout(resolve, parseInt(x.replace("2", '')) * 1000));
            startBot("Bot đã khởi động lại sau thời gian tạm nghỉ.");
        } else return;
    });

    child.on("error", function (error) {
        logger("Đã xảy ra lỗi khi khởi động bot: " + JSON.stringify(error), "[ BOT ERROR ]");
    });
};

startBot();
