const Sequelize = require('sequelize')
const schedule = require('node-schedule');
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

    logger.debug('Sms API Init...')

    router.post('/sendMessageToStaffs', async (ctx, next) => {
        try {
            logger.debug("监听到短信请求：", ctx.request.body);
            let paramArr = ctx.request.body;
            paramArr.forEach(element => {
                let phonenumber = element.phonenumber;
                delete element.phonenumber
                let params = {
                    "PhoneNumbers": phonenumber,
                    "SignName": "中节能合肥",
                    "TemplateCode": "SMS_166096683",
                    "TemplateParam": JSON.stringify(element)
                }
                client.request('SendSms', params, requestOption).then((result) => {
                    logger.debug(result);
                }, (ex) => {
                    logger.debug(ex);
                })
            });
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: 'update success' }
        } catch (error) {
            logger.debug(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'update fault' }
        }
    })

    router.post('/sendMessageToLeader', async (ctx, next) => {
        try {
            logger.debug("监听到回馈短信请求：", ctx.request.body);
            let paramObj = ctx.request.body;
            let phonenumber = paramObj.phonenumber;
            delete paramObj.phonenumber
            let params = {
                "PhoneNumbers": phonenumber,
                "SignName": "中节能合肥",
                "TemplateCode": "SMS_166081562",
                "TemplateParam": JSON.stringify(paramObj)
            }
            client.request('SendSms', params, requestOption).then((result) => {
                logger.debug(result);
            }, (ex) => {
                logger.debug(ex);
            })
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: 'update success' }
        } catch (error) {
            logger.debug(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'update fault' }
        }
    })

    ///设置一个定时器 每天的9点触发
    function setScheduleJob() {
        schedule.scheduleJob('0 40 14 * * *', () => {
            logger.debug('每天的9点触发:' + new Date());
            checkTaskHandler()
        });
    }
    async function checkTaskHandler() {
        logger.debug('开始检查');
        let currentTime = new Date().getTime();
        // logger.debug('当前时刻', currentTime);
        ///查询出状态 未完成 且截止时间大于当前时间的 isMessage===1 符合条件的对象
        ///同时左连接上users表获取 用户的详细信息  (暂时不会左连接，后期优化)
        let allUncompleteTaskData = await Tasks.findAll({
            where: {
                status: 0,
                isMessage: 1,
                overTime: { $gt: currentTime }
            }
        })
        logger.debug("符合条件的任务对象有几个:", allUncompleteTaskData.length);
        if (allUncompleteTaskData.length == 0) { return }
        logger.debug('分别是：');
        let tempArr = [];
        for (let item of allUncompleteTaskData) {
            let to_ids = item.to.substring(1, item.to.length - 1).split(',').map((item) => (parseInt(item)));
            let from_obj = await Users.findOne({ where: { id: item.from } })
            let to_Arr = await Users.findAll({ where: { id: to_ids } })
            let temp_to_arr = [];
            to_Arr.forEach((item) => {
                temp_to_arr.push({ name: item.name, phonenumber: item.phonenumber })
            })
            // logger.debug('单个对象：',temp_to_arr);
            tempArr.push({ title: item.title, name_from: from_obj.name, to: temp_to_arr });
        }
        logger.debug(tempArr);///短信任务数组列表
        sendMessageToNotice(tempArr);
    }
    function sendMessageToNotice(paramsArr) {
        paramsArr.forEach((item, index) => {
            // logger.debug('任务', index, '详情', item);
            // logger.debug('任务', index, '主题', item.title,'发起人',item.name_from);
            item.to.forEach((element) => {
                logger.debug('所有待发短信：主题', item.title, '发起人', item.name_from, '执行人', element.name, '执行人手机', element.phonenumber);
                let params = {
                    "PhoneNumbers": element.phonenumber,
                    "SignName": "中节能合肥",
                    "TemplateCode": "SMS_166096679",
                    "TemplateParam": JSON.stringify({ name_from: item.name_from, name: element.name, title: item.title })
                }
                client.request('SendSms', params, requestOption).then((result) => {
                    logger.debug(result);
                }, (ex) => {
                    logger.debug(ex);
                })
            })
        })
    }

    setScheduleJob() // 定时器
}