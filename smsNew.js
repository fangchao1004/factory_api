const Core = require('@alicloud/pop-core');

var client = new Core({
    accessKeyId: 'LTAIKlkSwGRxGUs2',
    accessKeySecret: 'VwwbCrudDp7g2cDmk6vNBtiwcCliyV',
    endpoint: 'https://dysmsapi.aliyuncs.com',
    apiVersion: '2017-05-25'
});

var requestOption = {
    method: 'POST'
};
module.exports = function (router, sequelize, logger) {
    /**
     * 手动发送督促短信
     */
    router.post('/sendMessageToNoticeNew', async (ctx, next) => {
        paramsArr = ctx.request.body;
        try {
            paramsArr.forEach((oneUser) => {
                // console.log(oneUser.name, oneUser.phonenumber);
                // console.log('待发生短信的用户:id', oneUser.id);
                let params = {
                    "PhoneNumbers": oneUser.phonenumber,
                    "SignName": "中节能合肥",
                    "TemplateCode": "SMS_170347285",
                    "TemplateParam": JSON.stringify({
                        name: oneUser.name
                    })
                }
                client.request('SendSms', params, requestOption).then((result) => {
                    logger.debug(result);
                }, (ex) => {
                    logger.debug(ex);
                })
            })
            ctx.response.type = 'json'
            ctx.response.body = {
                code: 0,
                data: 'update success'
            }
        } catch{
            ctx.response.type = 'json'
            ctx.response.body = {
                code: -1,
                data: 'update fault'
            }
        }
    });
}