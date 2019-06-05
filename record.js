const Sequelize = require('sequelize')
const fs = require('fs')
const path = require('path')
const uuidv1 = require('uuid/v1')
const send = require('koa-send')
const url = require("url")
const querystring = require("querystring")


module.exports = function (router, sequelize, logger) {

  logger.debug('Records API Init...')

  var Records = sequelize.define(
    'records',
    {
      id: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        autoIncrement: true
      },
      device_status: Sequelize.INTEGER(11),
      device_id: Sequelize.INTEGER(11),
      device_type_id: Sequelize.INTEGER(11),
      table_name: Sequelize.STRING(100),
      content: Sequelize.STRING(100),
      user_id: Sequelize.INTEGER(11),
    },
    {
      timestamps: true
    }
  )
  ///////////////////
  router.post('/insert_record', async (ctx, next) => {
    try {
      let copyRequsetBody = JSON.parse(JSON.stringify(ctx.request.body));
      let content = JSON.parse(copyRequsetBody.content);
      // logger.debug('初始化数据：',content);
      let contentAfterTrans = await transformHandler(content);
      ctx.request.body.content = JSON.stringify(contentAfterTrans);
      // logger.debug('我最后的返回值结果：', ctx.request.body);
      // return;
      await Records.create(ctx.request.body)
      ctx.response.type = 'json'
      ctx.response.body = { code: 0, data: 'success' }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'fault' }
    }
  })

  async function transformHandler(content) {
    // logger.debug("初始数据：" + JSON.stringify(content));
    for (let element of content) {
      if (element.type_id === "6" && element.value.length > 0) {  ///图片base64数组
        // logger.debug('图片数据：',element.value, typeof element.value);///array
        let newPathValueArr = await writeImages(element.value);
        // logger.debug("处理后的数组：",newPathValueArr);
        element.value = newPathValueArr;////["路径1","路径2",....]
      }
    };
    return content;
  }
  async function writeImages(imageArr) {
    let pathArr = [];
    for (const item of imageArr) {
      try { ////捕获Promise的异常
        let OneImgPath = await writeOneImg(item);
        pathArr.push(OneImgPath);
      } catch (error) {
        logger.debug('error:' + error);
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
        if (err) { reject('写入图片失败') }
        else {
          resolve(oneImgPath)
        }
      })
    });
    return p;
  }
  ///////////////////////
  router.post('/find_record', async (ctx, next) => {
    try {
      let all = await Records.findAll({
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
  router.post('/remove_record', async (ctx, next) => {
    try {
      await Records.destroy({
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
  router.post('/update_record', async (ctx, next) => {
    try {
      await Records.update(ctx.request.body.update, {
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

  router.post('/upload_file', async (ctx, next) => {
    // 上传单个文件
    console.log('upload file')
    const file = ctx.request.files.audio; // 获取上传文件
    console.log(ctx.request)
    const reader = fs.createReadStream(file.path)
    const uuid = uuidv1()
    let filePath = path.join(__dirname, 'public/upload/') + `/${uuid}.png`;
    // // 创建可写流
    const upStream = fs.createWriteStream(filePath);
    // // 可读流通过管道写入可写流
    reader.pipe(upStream);
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: uuid }
  })

  router.get('/get_audio', async (ctx) => {
    const arg = url.parse(ctx.req.url).query;
    const params = querystring.parse(arg);
    const uuid = params.uuid
    let filePath = path.join('public/upload/') + `/${uuid}.png`;
    ctx.attachment(filePath)
    await send(ctx, filePath)
  })

}