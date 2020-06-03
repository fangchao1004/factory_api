const Sequelize = require('sequelize')

module.exports = function (router, sequelize, logger) {

  logger.debug('Samples API Init...')

  var Samples = sequelize.define(
    'samples',
    {
      id: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        autoIncrement: true
      },
      effective: Sequelize.INTEGER(1),
      device_type_id: Sequelize.INTEGER(11),
      table_name: Sequelize.STRING(100),
      content: Sequelize.STRING(100),
      area0_id: Sequelize.INTEGER(11),///厂区id
    },
    {
      timestamps: true
    }
  )
  ///////////////////
  router.post('/insert_sample', async (ctx, next) => {
    try {
      await Samples.create(ctx.request.body)
      ctx.response.type = 'json'
      ctx.response.body = { code: 0, data: 'success' }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'fault' }
    }
  })
  router.post('/find_sample', async (ctx, next) => {
    try {
      let all = await Samples.findAll({
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
  router.post('/remove_sample', async (ctx, next) => {
    try {
      await Samples.destroy({
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
  router.post('/update_sample', async (ctx, next) => {
    try {
      await Samples.update(ctx.request.body.update, {
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