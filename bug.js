const Sequelize = require('sequelize')
const fs = require('fs')
const path = require('path')
const uuidv1 = require('uuid/v1')
const send = require('koa-send')
const url = require("url")
const querystring = require("querystring")

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
            device_id: Sequelize.INTEGER(11),
            user_id: Sequelize.INTEGER(11),
            fixed_user_id: Sequelize.INTEGER(11),
            status: Sequelize.INTEGER(1),
            content: Sequelize.STRING(100),
            buglevel: Sequelize.INTEGER(1),
            area_remark: Sequelize.STRING(100),
        },
        {
            timestamps: true
        }
    )

    router.post('/insert_bug', async (ctx, next) => {
        try {
            let result = await Bugs.create(ctx.request.body)
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: result }
        } catch (error) {
            console.error(error)
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


    router.post('/upload_file', async (ctx, next) => {
        // 上传单个文件
        const file = ctx.request.files.file; // 获取上传文件
        const reader = fs.createReadStream(file.path)
        const uuid = uuidv1()
        let filePath = path.join(__dirname, 'public/upload/') + `/${uuid}.${file.name.split('.')[file.name.split('.').length - 1]}`;
        // // 创建可写流
        const upStream = fs.createWriteStream(filePath);
        // // 可读流通过管道写入可写流
        reader.pipe(upStream);
        ctx.response.type = 'json'
        ctx.response.body = { code: 0, data: uuid }
    })

    router.get('/get_jpg', async (ctx) => {
        const arg = url.parse(ctx.req.url).query;
        const params = querystring.parse(arg);
        const uuid = params.uuid
        let filePath = path.join('public/upload/') + `/${uuid}.jpg`;
        ctx.attachment(filePath)
        await send(ctx, filePath)
    })
}