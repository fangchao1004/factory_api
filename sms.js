const Sequelize = require('sequelize')
const schedule = require('node-schedule');
const Core = require('@alicloud/pop-core');
const PushApi = require('./pushapi');

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

    var Pushs = sequelize.define(
        'pushs',
        {
            id: {
                type: Sequelize.STRING(100),
                primaryKey: true,
                autoIncrement: true
            },
            user_id: Sequelize.INTEGER(11),
            user_name: Sequelize.STRING(100),
            pushid: Sequelize.STRING(100)
        },
        {
            timestamps: true
        }
    )

    var Tasks = sequelize.define(
        'tasks',
        {
            id: {
                type: Sequelize.STRING(100),
                primaryKey: true,
                autoIncrement: true
            },
            effective: Sequelize.INTEGER(1),
            from: Sequelize.INTEGER(11),
            to: Sequelize.STRING(100),
            status: Sequelize.INTEGER(1),
            title: Sequelize.STRING(100),
            content: Sequelize.STRING(100),
            overTime: Sequelize.DOUBLE(13),
            isMessage: Sequelize.INTEGER(1),
            remark: Sequelize.STRING(100),
        },
        {
            timestamps: true
        }
    )
    var Users = sequelize.define(
        'users',
        {
            id: {
                type: Sequelize.STRING(100),
                primaryKey: true,
                autoIncrement: true
            },
            effective: Sequelize.INTEGER(1),
            level_id: Sequelize.INTEGER(11),
            isadmin: Sequelize.INTEGER(1),
            nfc_id: Sequelize.INTEGER(100),
            username: Sequelize.STRING(100),
            password: Sequelize.STRING(100),
            name: Sequelize.STRING(100),
            permission: Sequelize.STRING(100),
            phonenumber: Sequelize.STRING(11),
            remark: Sequelize.STRING(100)
        },
        {
            timestamps: true
        }
    )

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
        schedule.scheduleJob('0 0 9 * * *', () => {
            logger.debug('每天的9点触发:' + new Date());
            checkTaskHandler();///短信通知
            checkTaskHandlerToNoticeApp();///app通知
        });
    }
    async function checkTaskHandler() {
        logger.debug('开始检查');
        let currentTime = new Date().getTime();
        logger.debug('当前时刻', currentTime);
        ///查询出状态 未完成 且截止时间大于当前时间的 isMessage===1 符合条件的对象
        ///同时左连接上users表获取 用户的详细信息  (暂时不会左连接，后期优化)
        let allUncompleteTaskData = await Tasks.findAll({
            where: {
                status: 0,
                isMessage: 1,
                overTime: { $gt: currentTime }
            }
        })
        logger.debug("符合条件的 任务对象（短信通知） 有几个:", allUncompleteTaskData.length);
        if (allUncompleteTaskData.length == 0) { return }
        let allToUserIdArr = [];
        for (let item of allUncompleteTaskData) {
            let to_ids = item.to.substring(1, item.to.length - 1).split(',').map((item) => (parseInt(item)));///每一条任务，都可能有多个执行人
            allToUserIdArr = [...allToUserIdArr, ...to_ids]
        }
        logger.debug('这', allUncompleteTaskData.length, '个任务中包含的所有to_user:', allToUserIdArr);
        ///对这些人员id 进行去重复处理
        let distinctToUserArr = unique(allToUserIdArr);
        logger.debug('对这些人员id 进行去重复处理:', distinctToUserArr);
        let distinctToUserInfoArr = await Users.findAll({ where: { id: distinctToUserArr } })
        // console.log('查询到这些人员的信息:', distinctToUserInfoArr.length);
        //发生短信
        sendMessageToNotice(distinctToUserInfoArr);
    }
    function unique(arr) {
        return Array.from(new Set(arr))
    }
    function sendMessageToNotice(paramsArr) {
        paramsArr.forEach((oneUser) => {
            // console.log(oneUser.name, oneUser.phonenumber);
            // console.log('待发生短信的用户:id',oneUser.id);
            let params = {
                "PhoneNumbers": oneUser.phonenumber,
                "SignName": "中节能合肥",
                "TemplateCode": "SMS_170347285",
                "TemplateParam": JSON.stringify({ name: oneUser.name })
            }
            client.request('SendSms', params, requestOption).then((result) => {
                logger.debug(result);
            }, (ex) => {
                logger.debug(ex);
            })
        })
    }
    ////app通知的区别在于不要考虑 Tasks 的 isMessage字段。
    async function checkTaskHandlerToNoticeApp() {
        let currentTime = new Date().getTime();
        let allUncompleteTaskData = await Tasks.findAll({
            where: {
                status: 0,
                overTime: { $gt: currentTime }
            }
        })
        logger.debug("符合条件的 任务对象（app通知） 有几个:", allUncompleteTaskData.length);
        if (allUncompleteTaskData.length == 0) { return }
        let allToUserIdArr = [];
        for (let item of allUncompleteTaskData) {
            // console.log('item:',item);
            let to_ids = item.to.substring(1, item.to.length - 1).split(',').map((item) => (parseInt(item)));///每一条任务，都可能有多个执行人
            allToUserIdArr = [...allToUserIdArr, ...to_ids]
        }
        logger.debug('这', allUncompleteTaskData.length, '个任务中包含的所有to_user:', allToUserIdArr);
        ///对这些人员id 进行去重复处理
        let distinctToUserArr = unique(allToUserIdArr);
        logger.debug('对这些人员id 进行去重复处理:', distinctToUserArr);

        for (const userId of distinctToUserArr) {
            // console.log('userId:', userId);
            let all = await Pushs.findOne({
                where: { user_id: userId }
            })
            if (all) PushApi.pushMessageToSingle(all.pushid, '任务提醒', '您还有任务没有完成，请及时处理')
        }

    }

    setScheduleJob() // 定时器
}