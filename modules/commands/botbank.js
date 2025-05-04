const fs = require('fs-extra');
const path = './bankData.json';

if (!fs.existsSync(path)) fs.writeJsonSync(path, {});

async function handleBankCommand({ senderID, message, send }) {
    const data = await fs.readJson(path);
    const args = message.split(' ');
    const command = args[0].toLowerCase();

    if (!data[senderID]) {
        data[senderID] = { wallet: 0, bank: null };
    }

    // /bank register "số tài khoản"
    if (command === '/bank' && args[1] === 'register') {
        const accountNumber = args[2];
        if (!accountNumber) return send("Vui lòng nhập số tài khoản.");
        if (data[senderID].bank) return send("Bạn đã có tài khoản ngân hàng.");

        data[senderID].bank = { accountNumber, balance: 0 };
        await fs.writeJson(path, data);
        return send(`Tạo tài khoản thành công!\nSố tài khoản: ${accountNumber}`);
    }

    // /bank chuyển:"số tiền" "số tài khoản"
    if (command === '/bank' && message.includes('chuyển:')) {
        const match = message.match(/chuyển:(\d+)\s+(\d+)/);
        if (!match) return send("Sai cú pháp! Dùng: /bank chuyển:<số tiền> <số tài khoản>");

        const amount = parseInt(match[1]);
        const targetAcc = match[2];

        if (!data[senderID].bank) return send("Bạn chưa có tài khoản ngân hàng.");
        if (data[senderID].bank.balance < amount) return send("Số dư không đủ.");

        const targetID = Object.keys(data).find(id => data[id].bank?.accountNumber === targetAcc);
        if (!targetID) return send("Không tìm thấy tài khoản nhận.");

        data[senderID].bank.balance -= amount;
        data[targetID].bank.balance += amount;

        await fs.writeJson(path, data);
        return send(`Chuyển thành công ${amount} vào STK ${targetAcc}`);
    }

    // /bank rút:<số tiền> hoặc "all"
    if (command === '/bank' && message.includes('rút:')) {
        const match = message.match(/rút:(\d+|all)/);
        if (!match) return send("Sai cú pháp! Dùng: /bank rút:<số tiền> hoặc all");

        let amount = match[1] === 'all' ? data[senderID].bank.balance : parseInt(match[1]);

        if (!data[senderID].bank) return send("Bạn chưa có tài khoản.");
        if (amount > data[senderID].bank.balance) return send("Số dư không đủ.");

        data[senderID].bank.balance -= amount;
        data[senderID].wallet += amount;

        await fs.writeJson(path, data);
        return send(`Đã rút ${amount} vào ví cá nhân.`);
    }

    // /bankcheck
    if (command === '/bankcheck') {
        if (!data[senderID].bank) return send("Bạn chưa có tài khoản.");
        return send(`Số dư tài khoản: ${data[senderID].bank.balance}`);
    }

    // /usd
    if (command === '/usd') {
        return send(`Số tiền ngoài tài khoản (ví): ${data[senderID].wallet}`);
    }

    await fs.writeJson(path, data);
}
module.exports = handleBankCommand;
