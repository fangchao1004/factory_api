const Sequelize = require('sequelize')
const fs = require('fs')

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
            content: Sequelize.STRING(100),
            buglevel: Sequelize.INTEGER(1),
        },
        {
            timestamps: true
        }
    )

    router.post('/insert_bug', async (ctx, next) => {
        try {
            let copyRequsetBody = JSON.parse(JSON.stringify(ctx.request.body));
            let content = JSON.parse(copyRequsetBody.content);
            let contentAfterTrans = await transformHandler(content);
            ctx.request.body.content = JSON.stringify(contentAfterTrans);
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

    async function transformHandler(content) {
        // console.log("初始数据：" +  content.imgs.length);
        let newPathValueArr = await writeImages(content.imgs);
        // console.log("newPathValueArr:::", newPathValueArr);
        content.imgs = newPathValueArr;////["路径1","路径2",....]
        return content;
    }
    async function writeImages(imageArr) {
        let pathArr = [];
        for (const item of imageArr) {
            try { ////捕获Promise的异常
                let OneImgPath = await writeOneImg(item);
                pathArr.push(OneImgPath);
            } catch (error) {
                console.log('error:' + error);
                return [];
            }
        }
        // logger.debug('全部写入成功', pathArr);
        return pathArr;
    }
    function writeOneImg(item) {
        ////最底层的异步操作，要包含在Promise方法中。用于直接调用 resolve 或 reject
        let p = new Promise(function (resolve, reject) {        //做一些异步操作
            let oneImgPath = '/Users/fangchao/Desktop/imageKU/' + new Date().getTime() + '.jpg';
            var base64Data = item.replace(/^data:image\/\w+;base64,/, "");
            let dataBuffer = new Buffer(base64Data, 'base64'); //把base64码转成buffer对象，
            fs.writeFile(oneImgPath, dataBuffer, function (err) {//用fs写入文件
                if (err) {
                    reject('写入图片失败')
                }
                else {
                    resolve(oneImgPath)
                }
            })
        });
        return p;
    }
}