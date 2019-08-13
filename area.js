const Sequelize = require('sequelize')

module.exports = function (router, sequelize, logger) {

  logger.debug('Areas API Init...')

  var Areas = sequelize.define(
    'areas',
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
  router.post('/insert_area', async (ctx, next) => {
    try {
      await Areas.create(ctx.request.body)
      ctx.response.type = 'json'
      ctx.response.body = { code: 0, data: 'success' }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'fault' }
    }
  })
  router.post('/find_area', async (ctx, next) => {
    try {
      let all = await Areas.findAll({
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
  router.post('/remove_area', async (ctx, next) => {
    try {
      await Areas.destroy({
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
  router.post('/update_area', async (ctx, next) => {
    try {
      await Areas.update(ctx.request.body.update, {
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