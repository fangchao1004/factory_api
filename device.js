const Sequelize = require('sequelize')

module.exports = function (router, sequelize, logger) {

  logger.debug('Devices API Init...')

  var Devices = sequelize.define(
    'devices',
    {
      id: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        autoIncrement: true
      },
      nfc_id: Sequelize.INTEGER(11),
      name: Sequelize.STRING(100),
      remark: Sequelize.STRING(100),
      type_id: Sequelize.INTEGER(11),
      area_id: Sequelize.INTEGER(11),
      status: Sequelize.INTEGER(11),
    },
    {
      timestamps: true
    }
  )
  var Device_Types = sequelize.define(
    'device_types',
    {
      id: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        autoIncrement: true
      },
      name: Sequelize.STRING(100),
      sample_name: Sequelize.STRING(100),
    },
    {
      timestamps: true
    }
  )
  var Areas = sequelize.define(
    'areas',
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
  Devices.belongsTo(Device_Types, { foreignKey: 'type_id', targetKey: 'id' })
  Devices.belongsTo(Areas, { foreignKey: 'area_id', targetKey: 'id' })

  ///////////////////
  router.post('/insert_device', async (ctx, next) => {
    try {
      await Devices.create(ctx.request.body)
      ctx.response.type = 'json'
      ctx.response.body = { code: 0, data: 'success' }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'fault' }
    }
  })
  router.post('/find_device', async (ctx, next) => {
    try {
      let all = await Devices.findAll({
        where: ctx.request.body,
        include: [{ model: Device_Types }, { model: Areas }]
      })
      ctx.response.type = 'json'
      ctx.response.body = { code: 0, data: all }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'find fault' }
    }
  })
  router.post('/remove_device', async (ctx, next) => {
    try {
      await Devices.destroy({
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
  router.post('/update_device', async (ctx, next) => {
    try {
      await Devices.update(ctx.request.body.update, {
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