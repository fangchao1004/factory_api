///工具函数类
const moment = require('moment');
exports.findDurtion = function (list) {
    let today = moment().format('YYYY-MM-DD ');
    let tomorrow = moment().add(1, 'day').format('YYYY-MM-DD ');
    let currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
    // let currentTime = today + '23:41:00';///测试
    let result = null;
    let newList = list.map((item) => {
        if (!item.isCross) {
            item.begin = today + item.begin;
            item.end = today + item.end;
        } else {
            item.begin = today + item.begin;
            item.end = tomorrow + item.end;
        }
        return item;
    })
    for (var i = 0; i < newList.length; i++) {
        let item = newList[i];
        let nextItem = i === newList.length - 1 ? newList[newList.length - 1] : newList[i + 1];
        if (currentTime >= item.begin && currentTime <= item.end) {
            result = item;
            break;
        } else if (currentTime >= item.end && currentTime <= nextItem.begin) {
            result = nextItem;
            break;
        } else if (currentTime <= item.begin && i === 0) {
            result = item;
            break;
        }
    }
    return result;
}