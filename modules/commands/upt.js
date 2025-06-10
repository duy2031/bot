const os = require('os');
const moment = require('moment-timezone');
const fs = require('fs').promises;
const osu = require('os-utils');

module.exports.config = {
  name: "upt",
  version: "2.0.0",
  hasPermission: 3,
  credits: "VAZTEAM",
  description: "Hiển thị thông tin hệ thống của bot",
  commandCategory: "Admin",
  usages: "upt",
  cooldowns: 5
};

async function getDependencyCount() {
  try {
    const packageJsonString = await fs.readFile('package.json', 'utf8');
    const packageJson = JSON.parse(packageJsonString);
    const depCount = Object.keys(packageJson.dependencies || {}).length;
    const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
    return { depCount, devDepCount };
  } catch (error) {
    console.error('Không thể đọc file package.json:', error);
    return { depCount: -1, devDepCount: -1 };
  }
}

function getStatusByPing(ping) {
  if (ping < 200) {
    return 'tốt';
  } else if (ping < 800) {
    return 'bình thường';
  } else {
    return 'xấu';
  }
}

async function getBotFileSize() {
  try {
    const stats = await fs.stat(__filename);
    const fileSizeInBytes = stats.size;
    const fileSizeInKB = fileSizeInBytes / 1024;
    const fileSizeInMB = fileSizeInKB / 1024;
    return { fileSizeInBytes, fileSizeInKB, fileSizeInMB };
  } catch (error) {
    console.error('Không thể đọc thông tin file bot:', error);
    return { fileSizeInBytes: -1, fileSizeInKB: -1, fileSizeInMB: -1 };
  }
}

async function getCurrentCPUUsage() {
  return new Promise((resolve) => {
    osu.cpuUsage((v) => {
      resolve((v * 100).toFixed(2)); // Phần trăm CPU đã dùng, 2 chữ số thập phân
    });
  });
}

module.exports.run = async ({ api, event, Users, Threads }) => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const uptime = process.uptime();

  const { depCount, devDepCount } = await getDependencyCount();
  let name = await Users.getNameUser(event.senderID);
  const botStatus = getStatusByPing(Date.now() - event.timestamp);

  const uptimeHours = Math.floor(uptime / (60 * 60));
  const uptimeMinutes = Math.floor((uptime % (60 * 60)) / 60);
  const uptimeSeconds = Math.floor(uptime % 60);

  const uptimeString = `${uptimeHours} giờ ${uptimeMinutes} phút ${uptimeSeconds} giây`;

  const threadInfo = await Threads.getInfo(event.threadID);
  const memberCount = threadInfo.participantIDs.length;

  // Tìm admin đầu tiên trong nhóm
  const admins = threadInfo.adminIDs || [];
  const adminName = admins.length > 0 ? await Users.getNameUser(admins[0]) : "Không có";

  // Lấy kích thước file bot
  const { fileSizeInBytes, fileSizeInKB, fileSizeInMB } = await getBotFileSize();
  const cpuUsage = await getCurrentCPUUsage();

  // Lấy danh sách nhóm bot đang tham gia (tối đa 100 nhóm)
  const allThreads = await api.getThreadList(100, null, ["INBOX"]);
  const groupThreads = allThreads.filter(thread => thread.isGroup);
  const numberOfGroups = groupThreads.length;

  // Đếm số người dùng duy nhất trong tất cả nhóm
  let userSet = new Set();
  for (const thread of groupThreads) {
    try {
      const threadInfoGroup = await Threads.getInfo(thread.threadID);
      threadInfoGroup.participantIDs.forEach(id => userSet.add(id));
    } catch (e) {
      // Bỏ qua lỗi lấy info nhóm
    }
  }
  const numberOfUsers = userSet.size;

  // Soạn tin nhắn trả lời
  const replyMsg = `
⌛ Bây giờ là: ${moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss')} || ${moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY')}
🔌 Thời gian hoạt động: ${uptimeString}
📌 Prefix mặc định: ${global.config.PREFIX}
💬 Tổng số nhóm đang dùng bot: ${numberOfGroups}
💬 Tổng số người đang dùng bot: ${numberOfUsers}
📊 Tình trạng: ${botStatus}
🖥️ Hệ điều hành: ${os.type()} ${os.release()} (${os.arch()})
💻 CPU: ${os.cpus().length} core(s) - ${os.cpus()[0].model.trim()} @ ${os.cpus()[0].speed}MHz
🔄 CPU Đã Dùng: ${cpuUsage}%
🔋 RAM: ${(usedMemory / 1024 / 1024 / 1024).toFixed(2)}GB / ${(totalMemory / 1024 / 1024 / 1024).toFixed(2)}GB (Used / Total)
🆓 Dung lượng trống: ${(freeMemory / 1024 / 1024 / 1024).toFixed(2)}GB
📶 Ping: ${Date.now() - event.timestamp}ms
👤 Yêu cầu bởi: ${name}
`.trim();

  api.sendMessage({ body: replyMsg, attachment: global.krystal.splice(0, 1) }, event.threadID, event.messageID);
};
