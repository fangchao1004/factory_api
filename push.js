const Sequelize = require('sequelize')
const PushApi = require('./pushapi')

module.exports = function (router, sequelize, logger) {

    logger.debug('Pushs API Init...')

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

    router.post('/insert_push', async (ctx, next) => {
        try {
            let all = await Pushs.findOne({
                where: { user_id: ctx.request.body.user_id }
            })
            if (all) {
                await Pushs.update(ctx.request.body, {
                    where: { id: all.id }
                })
                ctx.response.type = 'json'
                ctx.response.body = { code: 0, data: 'update success' }
            } else {
                await Pushs.create(ctx.request.body)
                ctx.response.type = 'json'
                ctx.response.body = { code: 0, data: 'created success' }
            }
        } catch (error) {
            logger.error(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'insert fault' }
        }
    })
    router.post('/find_push', async (ctx, next) => {
        try {
            let all = await Pushs.findAll({
                where: ctx.request.body
            })
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: all }
        } catch (error) {
            logger.error(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'find fault' }
        }
    })

    /**
     * 可以传入 单个user_id 或是 一个user_id 数组
     * 1 或 [1,2,3,4]
     */
    router.post('/push_notice', async (ctx, next) => {
        try {
            let all = await Pushs.findAll({
                where: { user_id: ctx.request.body.user_id }
            }) /// 获取相关人员的pushid
            console.log('user_id:', ctx.request.body.user_id)
            let temp = all.map((item) => {
                let obj = {};
                obj.user_id = item.user_id
                obj.user_name = item.user_name
                obj.pushid = item.pushid
                return obj
            })
            console.log('push表中查询到这几个:', temp)
            if (all) {
                for (let i = 0; i < all.length; i++) {
                    const oneUserInfo = all[i];
                    let startTime = new Date().getTime();
                    console.log('开始推送', startTime, "pushid:" + oneUserInfo.pushid, "user_name:", oneUserInfo.user_name, "user_id:", oneUserInfo.user_id)
                    try {
                        let push_result = await PushApi.pushMessageToSingle(oneUserInfo.pushid, ctx.request.body.title, ctx.request.body.text)
                        if (push_result) {
                            console.log('推送成功: 耗时', (new Date().getTime() - startTime))
                        }
                    } catch (error) {
                        console.log('推送失败:', error)
                    }
                    console.log('===============================')
                }
            }
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: all }
        } catch (error) {
            logger.error(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'find fault' }
        }
    })
}