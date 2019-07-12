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
                where: {user_id: ctx.request.body.user_id}
            })
            if (all) {
                await Pushs.update(ctx.request.body, {
                    where: {id: all.id}
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
            let all = await Pushs.findOne({
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

    router.post('/push_notice', async (ctx, next) => {
        try {
            let all = await Pushs.findOne({
                where: {user_id: ctx.request.body.user_id}
            })
            if (all) PushApi.pushMessageToSingle(all.pushid, ctx.request.body.title, ctx.request.body.text)
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: all }
        } catch (error) {
            logger.error(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'find fault' }
        }
    })
}