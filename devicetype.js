const Sequelize = require('sequelize')

module.exports = function (router, sequelize, logger) {

    logger.debug('Device_Types API Init...')

    var Device_Types = sequelize.define(
        'device_types',
        {
            id: {
                type: Sequelize.STRING(100),
                primaryKey: true,
                autoIncrement: true
            },
            name: Sequelize.STRING(100),
            sample_name: Sequelize.STRING(100),
        },
        {
            timestamps: true
        }
    )
    ///////////////////
    router.post('/insert_device_type', async (ctx, next) => {
        try {
            await Device_Types.create(ctx.request.body)
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: 'success' }
        } catch (error) {
            logger.debug(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'fault' }
        }
    })
    router.post('/find_device_type', async (ctx, next) => {
        try {
            let all = await Device_Types.findAll({
                where: ctx.request.body
            })
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: all }
        } catch (error) {
            logger.debug(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'find fault' }
        }
    })
    router.post('/remove_device_type', async (ctx, next) => {
        try {
            await Device_Types.destroy({
                where: ctx.request.body
            })
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: 'remove sucess' }
        } catch (error) {
            logger.debug(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'remove fault' }
        }
    })
    router.post('/update_device_type', async (ctx, next) => {
        try {
            await Device_Types.update(ctx.request.body.update, {
                where: ctx.request.body.query
            })
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: 'update success' }
        } catch (error) {
            logger.debug(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'update fault' }
        }
    })
}