const Sequelize = require('sequelize')

module.exports = function (router, sequelize, logger) {

    logger.debug('Users API Init...')

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
            group_id: Sequelize.INTEGER(1),
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

    router.post('/loginByUserInfo', async (ctx, next) => {
        try {
            let all = await Users.findOne({
                where: {
                    username: ctx.request.body.username,
                    password: ctx.request.body.password
                }
            })
            if (all) {
                ctx.response.type = 'json'
                ctx.response.body = {
                    code: 0,
                    data: all
                }
            } else {
                ctx.response.type = 'json'
                ctx.response.body = {
                    code: -2,
                    data: '用户名密码错误'
                }
            }
        } catch (error) {
            logger.debug(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'find fault' }
        }
    })

    router.post('/insert_user', async (ctx, next) => {
        try {
            if (ctx.request.body.username == "" || ctx.request.body.password == "") {
                ctx.response.type = 'json'
                ctx.response.body = { code: -2, data: '用户名/密码不能为空' }
                return
            }
            var all = await Users.findAll({
                where: {
                    username: ctx.request.body.username
                }
            })
            if (all && all.length > 0) {
                ctx.response.type = 'json'
                ctx.response.body = { code: -2, data: '注册失败 该玩家已经存在' }
            } else {
                await Users.create(ctx.request.body)
                ctx.response.type = 'json'
                ctx.response.body = { code: 0, data: 'success' }
            }
        } catch (error) {
            logger.debug(error)
            ctx.response.type = 'json'
            ctx.response.body = { code: -1, data: 'fault' }
        }
    })

    router.post('/find_user', async (ctx, next) => {
        try {
            let all = await Users.findAll({
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
    router.post('/remove_user', async (ctx, next) => {
        try {
            await Users.destroy({
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
    router.post('/update_user', async (ctx, next) => {
        try {
            await Users.update(ctx.request.body.update, {
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