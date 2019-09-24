const Sequelize = require('sequelize')

module.exports = function (router, sequelize, logger) {

  logger.debug('Tasks API Init...')

  var Tasks = sequelize.define(
    'tasks',
    {
      id: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        autoIncrement: true
      },
      effective: Sequelize.INTEGER(1),
      from: Sequelize.INTEGER(11),
      to: Sequelize.STRING(100),
      status: Sequelize.INTEGER(1),
      title: Sequelize.STRING(100),
      content: Sequelize.STRING(100),
      overTime: Sequelize.DOUBLE(13),
      isMessage: Sequelize.INTEGER(1),
      remark: Sequelize.STRING(100),
      step_remark: Sequelize.STRING(100),
    },
    {
      timestamps: true
    }
  )
  ///////////////////
  router.post('/insert_task', async (ctx, next) => {
    try {
      await Tasks.create(ctx.request.body)
      ctx.response.type = 'json'
      ctx.response.body = { code: 0, data: 'success' }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'fault' }
    }
  })
  router.post('/find_task', async (ctx, next) => {
    try {
      let all = await Tasks.findAll({
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
  router.post('/remove_task', async (ctx, next) => {
    try {
      await Tasks.destroy({
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
  router.post('/update_task', async (ctx, next) => {
    try {
      await Tasks.update(ctx.request.body.update, {
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