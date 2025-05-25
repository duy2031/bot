module.exports.config = {
  name: "tt",
  version: "1.2.6",
  hasPermssion: 0,
  credits: "MintDaL",
  description: "Một số thông tin về bot",
  commandCategory: "Box Chat",
  hide:true,
  usages: "",
  cooldowns: 5,
    dependencies: {
		"fast-speedtest-api": ""
	}
};


module.exports.run = async function ({ api, event, args, Users, permssion, getText ,Threads}) {
  const content = args.slice(1, args.length);
  const { threadID, messageID, mentions } = event;
  const { configPath } = global.client;
  const { ADMINBOT } = global.config;
   const { NDH } = global.config;
  const { userName } = global.data;
  const request = global.nodemodule["request"];
  const fs = global.nodemodule["fs-extra"];
  const { writeFileSync } = global.nodemodule["fs-extra"];
  const mention = Object.keys(mentions);
  delete require.cache[require.resolve(configPath)];
  var config = require(configPath);
  const listAdmin = ADMINBOT || config.ADMINBOT || [];
  const listNDH = NDH || config.NDH ||  [];
  {
    const PREFIX = config.PREFIX;
    const namebot = config.BOTNAME;
    const { commands } = global.client;
    const threadSetting = (await Threads.getData(String(event.threadID))).data || 
    {};
    const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX 
    : global.config.PREFIX;
    const fast = global.nodemodule["fast-speedtest-api"];
		const speedTest = new fast({
			token: "YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm",
			verbose: false,
			timeout: 10000,
			https: true,
			urlCount: 5,
			bufferSize: 8,
			unit: fast.UNITS.Mbps
		});
		const resault = await speedTest.getSpeed();
    const dateNow = Date.now();
    const time = process.uptime(),
	      	hours = Math.floor(time / (60 * 60)),
		      minutes = Math.floor((time % (60 * 60)) / 60),
		      seconds = Math.floor(time % 60);
    const data = [
     ""
    var link = [
      "https://i.imgur.com/znC5vHk.mp4",
      "https://i.imgur.com/Ol965H9.mp4",
      "https://i.imgur.com/NbGH1b7.mp4",
      "https://i.imgur.com/BNoEDun.mp4",
      "https://i.imgur.com/XVeDeFU.mp4",
      "https://i.imgur.com/mUnaEJG.mp4",
      "https://i.imgur.com/NnBbtJe.mp4",
      "https://i.imgur.com/efKd3ZY.mp4",
      "https://i.imgur.com/ummUlBc.mp4",
      "https://i.imgur.com/DD7wOi9.mp4",
      "https://i.imgur.com/ITrdhmp.mp4"
    ];
    
    var i = 1;
    var msg = [];
    const moment = require("moment-timezone");
    const date = moment.tz("Asia/Ho_Chi_minh").format("HH:MM:ss L");
    for (const idAdmin of listAdmin) {
      if (parseInt(idAdmin)) {
        const name = await Users.getNameUser(idAdmin);
        msg.push(`${i++}/ ${name} - ${idAdmin}`);
      }
    }
    var msg1 = [];
            for (const idNDH of listNDH) {
                if (parseInt(idNDH)) {
                  const name1 = (await Users.getData(idNDH)).name
                    msg1.push(`${i++}/ ${name1} - ${idNDH}`);
                }
            }
    var callback = () => 
      api.sendMessage({ body: `====「 ${namebot} 」====\n━━━━━━━━━━━━━━━━\n[🔰] → 𝐏𝐫𝐞𝐟𝐢𝐱 𝐡𝐞̣̂ 𝐭𝐡𝐨̂́𝐧𝐠: ${PREFIX}\n[📛] → 𝐏𝐫𝐞𝐟𝐢𝐱 𝐛𝐨𝐱: ${prefix}\n[📱] → 𝐌𝐨𝐝𝐮𝐥𝐞𝐬: 𝐂𝐨́ ${commands.size} 𝐥𝐞̣̂𝐧𝐡\n[🌐] → 𝐏𝐢𝐧𝐠: ${Date.now() - dateNow}𝐦𝐬\n[📈] → 𝐅𝐚𝐬𝐭: ${resault} 𝐌𝐁𝐒\n──────────────\n=====「 𝐀𝐃𝐌𝐈𝐍 」 =====\n${msg.join("\n")}\n──────────────\n===「 𝐍𝐆𝐔̛𝐎̛̀𝐈 𝐇𝐎̂̃ 𝐓𝐑𝐎̛̣ 」 ===\n${msg1.join("\n")}\n──────────────\n[⏰] → 𝐓𝐡𝐨̛̀𝐢 𝐠𝐢𝐚𝐧 𝐁𝐨𝐭 đ𝐚̃ 𝐨𝐧𝐥𝐢𝐧𝐞 ${hours} 𝐠𝐢𝐨̛̀ ${minutes} 𝐩𝐡𝐮́𝐭 ${seconds} 𝐠𝐢𝐚̂𝐲\n[🌱] → 𝐓𝐨̂̉𝐧𝐠 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐝𝐮̀𝐧𝐠: ${global.data.allUserID.length} \n[🐬] → 𝐓𝐨̂̉𝐧𝐠 𝐛𝐨𝐱 𝐛𝐨𝐭 đ𝐚𝐧𝐠 𝐨̛̉: ${global.data.allThreadID.length}\n──────────────\n[🍒] → 𝐁𝐚̣𝐧 𝐜𝐨́ 𝐛𝐢𝐞̂́𝐭: ${data[Math.floor(Math.random() * data.length)]}`, attachment: fs.createReadStream(__dirname + "/cache/nah.mp4"), }, event.threadID, () => fs.unlinkSync(__dirname + "/cache/nah.mp4"));
      return request(encodeURI(link[Math.floor(Math.random() * link.length)])).pipe(fs.createWriteStream(__dirname + "/cache/nah.mp4")).on("close", () => callback()); 
  }
};
