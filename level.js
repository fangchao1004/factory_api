const Sequelize = require('sequelize')

module.exports = function (router, sequelize, logger) {

  logger.debug('Levels AND Majors API Init...')

  var Levels = sequelize.define(
    'levels',
    {
      id: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        autoIncrement: true
      },
      name: Sequelize.STRING(100),
    },
    {
      timestamps: true
    }
  )
  ///////////////////
  router.post('/insert_level', async (ctx, next) => {
    try {
      await Levels.create(ctx.request.body)
      ctx.response.type = 'json'
      ctx.response.body = { code: 0, data: 'success' }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'fault' }
    }
  })
  router.post('/find_level', async (ctx, next) => {
    try {
      let all = await Levels.findAll({
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
  router.post('/remove_level', async (ctx, next) => {
    try {
      await Levels.destroy({
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
  router.post('/update_level', async (ctx, next) => {
    try {
      await Levels.update(ctx.request.body.update, {
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

  var Majors = sequelize.define(
    'majors',
    {
      id: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        autoIncrement: true
      },
      name: Sequelize.STRING(100),
    },
    {
      timestamps: true
    }
  )
  ///////////////////
  router.post('/insert_major', async (ctx, next) => {
    try {
      await Majors.create(ctx.request.body)
      ctx.response.type = 'json'
      ctx.response.body = { code: 0, data: 'success' }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'fault' }
    }
  })
  router.post('/find_major', async (ctx, next) => {
    try {
      let all = await Majors.findAll({
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
  router.post('/remove_major', async (ctx, next) => {
    try {
      await Majors.destroy({
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
  router.post('/update_major', async (ctx, next) => {
    try {
      await Majors.update(ctx.request.body.update, {
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