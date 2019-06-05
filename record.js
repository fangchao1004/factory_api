const Sequelize = require('sequelize')

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
  router.post('/insert_record', async (ctx, next) => {
    try {
      await Records.create(ctx.request.body)
      ctx.response.type = 'json'
      ctx.response.body = { code: 0, data: 'success' }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'fault' }
    }
  })
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
}