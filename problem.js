const Sequelize = require('sequelize')

module.exports = function (router, sequelize, logger) {

  logger.debug('Problems API Init...')

  var Problems = sequelize.define(
    'problems',
    {
      id: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        autoIncrement: true
      },
      user_id: Sequelize.INTEGER(11),
      warning_level: Sequelize.INTEGER(11),
      remark: Sequelize.STRING(100),
      status: Sequelize.INTEGER(11),
    },
    {
      timestamps: true
    }
  )
  ///////////////////
  router.post('/insert_problem', async (ctx, next) => {
    try {
      let copyData = JSON.parse(JSON.stringify(ctx.request.body))
      let remark = JSON.parse(copyData.remark)
      let imgsArr = remark.imgs
      let imgsPathArr = [];
      if (imgsArr.length > 0) {
        imgsPathArr = await writeImages(imgsArr)
      }
      remark.imgs = imgsPathArr;
      ctx.request.body.remark = JSON.stringify(remark);
      await Problems.create(ctx.request.body)
      ctx.response.type = 'json'
      ctx.response.body = { code: 0, data: 'success' }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'fault' }
    }
  })
  router.post('/find_problem', async (ctx, next) => {
    try {
      let all = await Problems.findAll({
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
  router.post('/remove_problem', async (ctx, next) => {
    try {
      await Problems.destroy({
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
  router.post('/update_problem', async (ctx, next) => {
    try {
      await Problems.update(ctx.request.body.update, {
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