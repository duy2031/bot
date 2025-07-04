const axios = require("axios");
const fs = require("fs-extra");
const FormData = require("form-data");
const crypto = require("crypto");

module.exports.config = {
  name: "4k",
  version: "1.0.3",
  hasPermssion: 0,
  credits: "Satoru",
  description: "Làm nét ảnh bằng AI (Có thể dùng URL)",
  commandCategory: "Box",
  cooldowns: 5,
  usePrefix: true
};

module.exports.run = async function ({ api, event, args }) {
  let imgUrl = null;
  let imgFile = null;

  if (args[0]?.startsWith("http")) {
    imgUrl = args[0];
  } else if (event.messageReply) {
    imgFile = event.messageReply.attachments.find(att => att.type === "photo");
    if (imgFile) imgUrl = imgFile.url;
  } else {
    imgFile = event.attachments.find(att => att.type === "photo");
    if (imgFile) imgUrl = imgFile.url;
  }

  if (!imgUrl)
    return api.sendMessage(
      "Vui lòng:\n1. Reply một ảnh\n2. Gửi ảnh kèm lệnh\n3. Gửi URL ảnh sau lệnh /4k",
      event.threadID,
      event.messageID
    );

  api.sendMessage("⏳ Đang làm nét ảnh ...", event.threadID, async (err, info) => {
    try {
      const imgResponse = await axios.get(imgUrl, { responseType: "arraybuffer" });
      const buffer = await reminiUpscale(Buffer.from(imgResponse.data));

      const pathSave = __dirname + `/cache/remaker_upscale_${event.senderID}_${Date.now()}.png`;
      const resultBuffer = await axios.get(buffer.result.image_url, { responseType: "arraybuffer" });
      fs.writeFileSync(pathSave, resultBuffer.data);

      return api.sendMessage(
        {
          body: `✅ Ảnh đã được làm nét thành công!`,
          attachment: fs.createReadStream(pathSave)
        },
        event.threadID,
        () => {
          fs.unlinkSync(pathSave);
          api.unsendMessage(info.messageID);
        },
        event.messageID
      );
    } catch (error) {
      return api.sendMessage(
        `Đã xảy ra lỗi: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }, event.messageID);
};

function generateFingerprint() {
  const components = [
    process.version,
    process.arch,
    process.platform,
    Math.random().toString(),
    Date.now().toString()
  ];
  return crypto.createHash("md5").update(components.join("|")).digest("hex");
}

function reminiUpscale(buffer) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("type", "Enhancer");
    form.append("original_image_file", buffer, "blob");

    const productSerial = generateFingerprint();

    axios.post("https://api.remaker.ai/api/pai/v4/ai-enhance/create-job-new", form, {
      headers: {
        ...form.getHeaders(),
        "authorization": "",
        "product-code": "067003",
        "product-serial": productSerial,
        "Referer": "https://remaker.ai/"
      }
    }).then((createJobResponse) => {
      if (createJobResponse.data.code !== 100000) {
        reject({
          creator: global.creator,
          status: false,
          error: `Job creation failed: ${createJobResponse.data.message.en}`
        });
        return;
      }

      const jobId = createJobResponse.data.result.job_id;

      const checkJobStatus = () => {
        axios.get(`https://api.remaker.ai/api/pai/v4/ai-enhance/get-job/${jobId}`, {
          headers: {
            "authorization": "",
            "product-code": "067003",
            "product-serial": productSerial,
            "Referer": "https://remaker.ai/"
          }
        }).then((jobResponse) => {
          if (jobResponse.data.code === 100000) {
            resolve({
              status: true,
              result: {
                job_id: jobId,
                image_url: jobResponse.data.result.output[0]
              }
            });
          } else if (jobResponse.data.code === 300013) {
            setTimeout(checkJobStatus, 3000);
          } else {
            reject({
              creator: global.creator,
              status: false,
              error: `Job failed: ${jobResponse.data.message.en}`
            });
          }
        }).catch((error) => {
          reject({
            creator: global.creator,
            status: false,
            error: error.message
          });
        });
      };

      checkJobStatus();
    }).catch((error) => {
      reject({
        creator: global.creator,
        status: false,
        error: error.message
      });
    });
  });
}
