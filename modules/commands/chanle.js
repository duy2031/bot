const axios = require("axios");

module.exports.config = {
	name: "banchanle",
	version: "1.0.0",
	hasPermssion: 0,
	credits: "Thiệu Trung Kiên",
	description: "Game chẵn lẻ nhiều người",
	commandCategory: "Trò Chơi",
	usages: "[create/join/start/end]",
	cooldowns: 5
};

module.exports.run = async function({
	api: e,
	event: n,
	Currencies: a,
	Threads: s,
	Users: t,
	args: r
}) {
	try {
		global.chanle || (global.chanle = new Map);
		const {
			threadID: s,
			messageID: o,
			senderID: i
		} = n;
		var g = global.chanle.get(s);
		const c = (await axios.get("https://i.imgur.com/LClPl36.jpg", {
			responseType: "stream"
		})).data;

		switch (r[0]) {
			case "create":
			case "new":
			case "-c": {
				if (!r[1] || isNaN(r[1])) return e.sendMessage("Bạn cần nhập số tiền đặt cược!", s, o);
				if (parseInt(r[1]) < 50) return e.sendMessage("Số tiền phải lớn hơn hoặc bằng 50", s, o);
				const g = await a.getData(n.senderID);
				if (g.money < parseInt(r[1])) return e.sendMessage(`Bạn không có đủ ${r[1]} để tạo bàn game mới!!`, s, o);
				if (global.chanle.has(s)) return e.sendMessage("Nhóm này đã được mở bàn game!", s, o);
				var h = await t.getNameUser(i);
				global.chanle.set(s, {
					box: s,
					start: !1,
					author: i,
					player: [{
						name: h,
						userID: i,
						choose: {
							status: !1,
							msg: null
						}
					}],
					money: parseInt(r[1])
				});
				return e.sendMessage("Tạo thành công phòng chẵn lẻ với số tiền cược là: " + r[1], s);
			}

			case "join":
			case "-j": {
				if (!global.chanle.has(s)) return e.sendMessage("Nhóm này hiện chưa có bàn game nào!\n=> Vui lòng hãy tạo bàn game mới để tham gia!", s, o);
				if (1 == g.start) return e.sendMessage("Hiện tại bàn game này đã bắt đầu từ trước!", s, o);
				const r = await a.getData(n.senderID);
				if (r.money < g.money) return e.sendMessage(`Bạn không có đủ $ để tham gia bàn game này! ${g.money}$`, s, o);
				if (g.player.find((e => e.userID == i))) return e.sendMessage("Hiện tại bạn đã tham gia bàn game này!", s, o);
				h = await t.getNameUser(i);
				g.player.push({
					name: h,
					userID: i,
					choose: {
						status: !1,
						msg: null
					}
				});
				global.chanle.set(s, g);
				return e.sendMessage(`Bạn đã tham gia bàn game!\n=> Số thành viên hiện tại là: ${g.player.length}`, s, o);
			}

			case "start":
			case "-s":
				if (!g) return e.sendMessage("Nhóm này hiện chưa có bàn game nào!\n=> Vui lòng hãy tạo bàn game mới để tham gia!", s, o);
				if (g.author != i) return e.sendMessage("Bạn không phải là người tạo ra bàn game này nên không thể bắt đầu game", s, o);
				if (g.player.length <= 1) return e.sendMessage("Bàn game của bạn không có đủ thành viên để có thể bắt đầu!", s, o);
				if (g.start == 1) return e.sendMessage("Hiện tại bàn game này đã bắt đầu từ trước!", s, o);

				g.start = !0;
				global.chanle.set(s, g);
				e.sendMessage(`Game bắt đầu\n\nSố thành viên: ${g.player.length}\n\nVui lòng chat "Chẵn" hoặc "Lẻ" để chọn.`, s);

				// ⏳ Timeout 2 phút nếu không ai chọn
				setTimeout(() => {
					const room = global.chanle.get(s);
					if (room && room.start) {
						const picked = room.player.filter(p => p.choose.status === true);
						if (picked.length < room.player.length) {
							global.chanle.delete(s);
							e.sendMessage("Trò chơi bị huỷ do không đủ người chọn trong 2 phút!", s);
						}
					}
				}, 120000);
				return;

			case "end":
			case "-e":
				if (!g) return e.sendMessage("Nhóm này hiện chưa có bàn game nào!", s, o);
				if (g.author != i) return e.sendMessage("Bạn không phải là người tạo ra bàn game nên không thể xoá bàn game", s, o);
				global.chanle.delete(s);
				return e.sendMessage("Đã xoá bàn game!", s, o);

			default:
				return e.sendMessage({
					body: "Chơi Chẵn Lẻ Nhiều Người\n1. => banchanle create <price> để tạo phòng\n2. => banchanle join để vào phòng\n3. => banchanle start để bắt đầu trò chơi\n4. => banchanle end để xoá phòng",
					attachment: c
				}, s, o);
		}
	} catch (e) {
		console.log(e);
	}
};
