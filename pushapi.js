var GeTui = require('./GT.push');
var Target = require('./getui/Target');
var APNPayload = require('./payload/APNPayload');
var DictionaryAlertMsg = require('./payload/DictionaryAlertMsg');
var NotificationTemplate = require('./getui/template/NotificationTemplate');
var SingleMessage = require('./getui/message/SingleMessage');
// var HOST = 'http://sdk.open.api.igexin.com/apiex.htm';
var HOST = 'https://api.getui.com/apiex.htm';
var APPID = 'hLtqNZ3qQJAWqHx3eKdNB8';
var APPKEY = 'dB8EwIYkNc8sTE189JXfiA';
var MASTERSECRET = 'BkMXHA7PblAUCIUbNkyQz1';
var gt = new GeTui(HOST, APPKEY, MASTERSECRET);

var PushApi = {}

PushApi.pushMessageToSingle = function (cid, title, text) {
    return new Promise((resolve, reject) => {

        var template = new NotificationTemplate({
            appId: APPID,
            appKey: APPKEY,
            title,
            text,
            isRing: true,
            isVibrate: true,
            isClearable: true,
        })

        var payload = new APNPayload();
        var alertMsg = new DictionaryAlertMsg();
        alertMsg.body = text;
        alertMsg.actionLocKey = "actionLocKey";
        alertMsg.locKey = "locKey";
        alertMsg.locArgs = Array("locArgs");
        alertMsg.launchImage = "launchImage";
        //ios8.2以上版本支持
        alertMsg.title = title;
        alertMsg.titleLocKey = "titleLocKey";
        alertMsg.titleLocArgs = Array("titleLocArgs");

        payload.alertMsg = alertMsg;
        payload.badge = 0;
        payload.contentAvailable = 1;
        payload.category = "";
        payload.sound = "";
        payload.customMsg.payload1 = "payload";
        template.setApnInfo(payload);

        var message = new SingleMessage({
            isOffline: true,                        //是否离线
            offlineExpireTime: 3600 * 12 * 1000,    //离线时间
            data: template,                         //设置推送消息类型
            pushNetWorkType: 0                     //是否wifi ，0不限，1wifi
        });

        var target = new Target({
            appId: APPID,
            clientId: cid
        });

        gt.pushMessageToSingle(message, target, function (err, res) {
            if (res.result === 'ok') {
                resolve(true);
            }else{
                reject(res.result)
            }
            if (err != null && err.exception != null && err.exception instanceof RequestError) {
                reject(err);
                var requestId = err.exception.requestId;
                gt.pushMessageToSingle(message, target, requestId, function (err, res) {
                    console.log("err:", err);
                    console.log("res:::::::", res);
                });
            }
        });
    })
}

module.exports = PushApi