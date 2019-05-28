const Sequelize = require('sequelize')

module.exports = function (router, sequelize, logger) {

    logger.debug('Bugs API Init...')

    var Bugs = sequelize.define(
        'bugs',
        {
            id: {
                type: Sequelize.STRING(100),
                primaryKey: true,
                autoIncrement: true
            },
            record_id: Sequelize.INTEGER(11),
            device_id: Sequelize.INTEGER(11),
            user_id: Sequelize.INTEGER(11),
            fixed_user_id: Sequelize.INTEGER(11),
            status: Sequelize.INTEGER(1),
            content: Sequelize.STRING(100)
        },
        {
            timestamps: true
        }
    )

    router.post('/insert_bug', async (ctx, next) => {
        try {
            await Bugs.create(ctx.request.body)
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: 'success' }
        } catch (error) {
            logger.error(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'fault' }
        }
    })
    router.post('/find_bug', async (ctx, next) => {
        try {
            let all = await Bugs.findAll({
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
    router.post('/remove_bug', async (ctx, next) => {
        try {
            await Bugs.destroy({
                where: ctx.request.body
            })
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: 'remove sucess' }
        } catch (error) {
            logger.error(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'remove fault' }
        }
    })
    router.post('/update_bug', async (ctx, next) => {
        try {
            await Bugs.update(ctx.request.body.update, {
                where: ctx.request.body.query
            })
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: 'update success' }
        } catch (error) {
            logger.error(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'update fault' }
        }
    })
}