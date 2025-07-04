module.exports.config = {
    name: "resetmoney",
    version: "1.0.0",
    hasPermssion: 3,
    credits: "manhIT",
    description: "Reset số tiền của cả nhóm về 0",
    commandCategory: "Kiếm Tiền",
    usages: "[cc], [del], [all]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, Currencies }) => {
    const data = await api.getThreadInfo(event.threadID);
    for (const user of data.userInfo) {
        var currenciesData = await Currencies.getData(user.id)
        if (currenciesData != false) {
            var money = currenciesData.money;
            if (typeof money != "undefined") {
                money -= money;
                await Currencies.setData(user.id, { money });
            }
        }
    }
    return api.sendMessage("Số tiền của thành viên nhóm đã được reset về mức 0 !", event.threadID);
}
