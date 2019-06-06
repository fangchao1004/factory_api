const Sequelize = require('sequelize')

module.exports = function (router, sequelize, logger) {

  logger.debug('Nfcs API Init...')

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

  var Users = sequelize.define(
    'users',
    {
        id: {
            type: Sequelize.STRING(100),
            primaryKey: true,
            autoIncrement: true
        },
        level_id: Sequelize.INTEGER(11),
        isadmin: Sequelize.INTEGER(1),
        nfc_id: Sequelize.INTEGER(100),
        username: Sequelize.STRING(100),
        password: Sequelize.STRING(100),
        name: Sequelize.STRING(100),
        phonenumber: Sequelize.STRING(11),
        remark: Sequelize.STRING(100)
    },
    {
        timestamps: true
    }
)

  var Nfcs = sequelize.define(
    'nfcs',
    {
      id: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        autoIncrement: true
      },
      nfcid: Sequelize.STRING(100),
      type: Sequelize.INTEGER(11),
      name: Sequelize.STRING(100)
    },
    {
      timestamps: true
    }
  )

  router.post('/loginByNFC', async (ctx, next) => {
    try {
      let nfcOne = await Nfcs.findOne({
        where: {
          nfcid: ctx.request.body.nfcid,
          type: ctx.request.body.type
        }
      })
      if (nfcOne) {
        // logger.debug('nfc表中存在这个卡的数据_id是：', nfcOne.dataValues.id);
        let userInfo = await Users.findOne({
          where: {
            nfc_id: nfcOne.dataValues.id
          }
        })
        if (userInfo) {
          // logger.debug('用户数据：', userInfo);
          ctx.response.type = 'json'
          ctx.response.body = { code: 0, data: userInfo }
          return;
        } else {
          ctx.response.type = 'json'
          ctx.response.body = { code: -1, data: 'login fault by nfc' }
          return;
        }
      } else {
        ctx.response.type = 'json'
        ctx.response.body = { code: -1, data: 'find fault by nfc' }
        return;
      }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'find fault' }
    }
  })
  ////////////////////////pda贴在设备上 {nfcid:'XXXXXX',type:2}
  router.post('/getDeviceInfoByNFC', async (ctx, next) => {
    try {
      let nfcOne = await Nfcs.findOne({
        where: {
          nfcid: ctx.request.body.nfcid,
          type: ctx.request.body.type
        }
      })
      if (nfcOne) {
        logger.debug('nfc表中存在这个卡的数据_id是：', nfcOne.dataValues.id);
        let deviceInfo = await Devices.findOne({
          where: {
            nfc_id: nfcOne.dataValues.id
          }
        })
        if (deviceInfo) {
          logger.debug('deviceInfo::', deviceInfo);
          ctx.response.type = 'json'
          ctx.response.body = { code: 0, data: deviceInfo }
          return;
        } else {
          ctx.response.type = 'json'
          ctx.response.body = { code: -1, data: '没找到该设备信息' }
          return;
        }
      } else {
        ctx.response.type = 'json'
        ctx.response.body = { code: -1, data: '没找到该设备信息' }
        return;
      }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: '查询失败' }
    }
  })

  //////
  router.post('/insert_nfc', async (ctx, next) => {
    try {
      var all = await Nfcs.findAll({
        where: {
          nfcid: ctx.request.body.nfcid
        }
      })
      if (all && all.length > 0) {
        ctx.response.type = 'json'
        ctx.response.body = { code: -2, data: '新增失败 该NFC已经存在' }
      } else {
        await Nfcs.create(ctx.request.body)
        ctx.response.type = 'json'
        ctx.response.body = { code: 0, data: 'success' }
      }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'fault' }
    }
  })
  router.post('/find_nfc', async (ctx, next) => {
    try {
      let all = await Nfcs.findAll({
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
  router.post('/remove_nfc', async (ctx, next) => {
    try {
      await Nfcs.destroy({
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
  router.post('/update_nfc', async (ctx, next) => {
    try {
      await Nfcs.update(ctx.request.body.update, {
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