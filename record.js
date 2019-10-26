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
      effective: Sequelize.INTEGER(1),
      device_status: Sequelize.INTEGER(11),
      device_id: Sequelize.INTEGER(11),
      device_type_id: Sequelize.INTEGER(11),
      table_name: Sequelize.STRING(100),
      content: Sequelize.STRING(100),
      user_id: Sequelize.INTEGER(11),
      checkedAt: Sequelize.STRING(100),
    },
    {
      timestamps: true
    }
  )
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
  Records.belongsTo(Users, { foreignKey: 'user_id', targetKey: 'id' })

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
        where: ctx.request.body,
        include: [{ model: Users }]
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