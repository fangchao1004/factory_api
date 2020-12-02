const Sequelize = require('sequelize')

module.exports = function (router, sequelize, logger) {
  logger.debug('Users API Init...')

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
      group_id: Sequelize.INTEGER(1),
      isadmin: Sequelize.INTEGER(1),
      nfc_id: Sequelize.INTEGER(100),
      username: Sequelize.STRING(100),
      password: Sequelize.STRING(100),
      name: Sequelize.STRING(100),
      permission: Sequelize.STRING(100),
      phonenumber: Sequelize.STRING(11),
      remark: Sequelize.STRING(100),
      isGroupLeader: Sequelize.INTEGER(1),
      use_whitelist: Sequelize.INTEGER(1)
    },
    {
      timestamps: true
    }
  )

  var WhiteLists = sequelize.define(
    'whitelists',
    {
      id: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        autoIncrement: true
      },
      ip: Sequelize.CHAR(50)
    },
    {
      timestamps: false
    }
  )

  router.post('/verify', async (ctx, next) => {
    try {
      console.log(ctx.request.body, ctx.request.ip)

      const { username } = ctx.request.body
      const user = await Users.findOne({ where: { username } })
      const whiteLists = await WhiteLists.findAll()

      if (!user) throw new Error('no user existed')

      if (user.use_whitelist === 1) {
        if (whiteLists.length > 0) {
          let isWhiteList = false

          whiteLists.forEach(wl => {
            if (wl.dataValues.ip === ctx.request.ip) isWhiteList = true
          })

          if (isWhiteList) {
            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: 'user in whitelist' }
          } else throw new Error('user not in whitelist')
        } else {
          ctx.response.type = 'json'
          ctx.response.body = { code: 0, data: 'no whitelist existed' }
        }
      } else {
        ctx.response.type = 'json'
        ctx.response.body = { code: 0, data: 'user not use whitelist' }
      }
    } catch (error) {
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: error.message }
    }
  })

  router.post('/loginByUserInfo', async (ctx, next) => {
    try {
      let all = await Users.findOne({
        where: {
          username: ctx.request.body.username,
          password: ctx.request.body.password
        }
      })
      if (all) {
        ctx.response.type = 'json'
        ctx.response.body = {
          code: 0,
          data: all
        }
      } else {
        ctx.response.type = 'json'
        ctx.response.body = {
          code: -2,
          data: '用户名密码错误'
        }
      }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'find fault' }
    }
  })

  router.post('/insert_user', async (ctx, next) => {
    try {
      if (ctx.request.body.username == '' || ctx.request.body.password == '') {
        ctx.response.type = 'json'
        ctx.response.body = { code: -2, data: '用户名/密码不能为空' }
        return
      }
      var all = await Users.findAll({
        where: {
          username: ctx.request.body.username
        }
      })
      if (all && all.length > 0) {
        ctx.response.type = 'json'
        ctx.response.body = { code: -2, data: '注册失败 该玩家已经存在' }
      } else {
        let result = await Users.create(ctx.request.body)
        ctx.response.type = 'json'
        ctx.response.body = { code: 0, data: result }
      }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'fault' }
    }
  })

  router.post('/find_user', async (ctx, next) => {
    try {
      let all = await Users.findAll({
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
  router.post('/remove_user', async (ctx, next) => {
    try {
      await Users.destroy({
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
  router.post('/update_user', async (ctx, next) => {
    try {
      await Users.update(ctx.request.body.update, {
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
