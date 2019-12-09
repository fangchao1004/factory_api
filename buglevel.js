const Sequelize = require('sequelize')

module.exports = function (router, sequelize, logger) {

    logger.debug('Bug_Levels And Bug_Types API Init...')
    // console.log('Bug_Levels And Bug_Types API Init...')

    var Bug_Levels = sequelize.define(
        'bug_levels',
        {
            id: {
                type: Sequelize.STRING(100),
                primaryKey: true,
                autoIncrement: true
            },
            effective: Sequelize.INTEGER(1),
            name: Sequelize.STRING(100),
        },
        {
            timestamps: true
        }
    )
    ///////////////////
    router.post('/insert_bug_level', async (ctx, next) => {
        try {
            await Bug_Levels.create(ctx.request.body)
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: 'success' }
        } catch (error) {
            logger.debug(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'fault' }
        }
    })
    router.post('/find_bug_level', async (ctx, next) => {
        console.log('find_bug_level');
        try {
            let all = await Bug_Levels.findAll({
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
    router.post('/remove_bug_level', async (ctx, next) => {
        try {
            await Bug_Levels.destroy({
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
    router.post('/update_bug_level', async (ctx, next) => {
        try {
            await Bug_Levels.update(ctx.request.body.update, {
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

    ///////////////////////////////

    var Bug_Types = sequelize.define(
        'bug_types',
        {
            id: {
                type: Sequelize.STRING(100),
                primaryKey: true,
                autoIncrement: true
            },
            effective: Sequelize.INTEGER(1),
            name: Sequelize.STRING(100),
        },
        {
            timestamps: true
        }
    )
    ///////////////////
    router.post('/insert_bug_type', async (ctx, next) => {
        try {
            await Bug_Types.create(ctx.request.body)
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: 'success' }
        } catch (error) {
            logger.debug(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'fault' }
        }
    })
    router.post('/find_bug_type', async (ctx, next) => {
        try {
            let all = await Bug_Types.findAll({
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
    router.post('/remove_bug_type', async (ctx, next) => {
        try {
            await Bug_Types.destroy({
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
    router.post('/update_bug_type', async (ctx, next) => {
        try {
            await Bug_Types.update(ctx.request.body.update, {
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