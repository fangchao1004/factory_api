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

  let WhiteLists = sequelize.define(
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

  let PCLoginLogs = sequelize.define(
    'pc_login_logs',
    {
      id: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        autoIncrement: true
      },
      name: Sequelize.CHAR(50),
      username: Sequelize.CHAR(50),
      ip: Sequelize.CHAR(50),
      status: Sequelize.INTEGER(1),
      remark: Sequelize.CHAR(50),
      uuid: Sequelize.CHAR(50),
    },
    {
      timestamps: true
    }
  )

  //------------------------------------------------------------------------------------
  // 列出会员
  //------------------------------------------------------------------------------------
  router.post('/listPCLoginLog', async (ctx, next) => {
    try {
      if (!ctx.request.body.hasOwnProperty('page')) throw new Error('参数错误')
      let page = parseInt(ctx.request.body.page) || 0
      page = Math.max(page, 1)
      delete ctx.request.body.page

      const data = await PCLoginLogs.findAndCountAll({
        where: ctx.request.body,
        offset: (page - 1) * 10,
        order: [['createdAt', 'DESC']],
        limit: 10
      })

      ctx.response.type = 'json'
      ctx.response.body = {
        code: 0,
        data: { count: data.count, logs: data.rows }
      }
    } catch (error) {
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: error.message }
    }
  })

  router.post('/verify', async (ctx, next) => {
    try {
      console.log(ctx.request.body, ctx.request.ip)
      let { username, uuid } = ctx.request.body
      const user = await Users.findOne({ where: { username, effective: 1 } })
      const whiteLists = await WhiteLists.findAll()
      ///查找当前用户的最近一条，登录记录。
      let uuid_is_different = false;///uuid与前一次不同
      if (uuid) {
        let res_last_log = await PCLoginLogs.findOne({ where: { username, $not: [{ uuid: null }] }, order: "id DESC" })///最近一次uuid不为null的登录。视为app登录
        if (res_last_log) {
          uuid_is_different = res_last_log.dataValues.uuid !== uuid///uuid与前一次不同
        }
      } else { uuid = null }
      ///uuid = null 视为pc登录。uuid 存在视为app登录
      let extra_remark = uuid_is_different ? '。注意！移动端登录设备发生变更' : ''///app登录，设备变更时的补充备注
      if (!user) {
        await PCLoginLogs.create({ name: '未知', username, ip: ctx.request.ip, status: 1, remark: '未知用户,拒绝登录' + extra_remark, uuid })
        throw new Error('no user existed')
      }

      if (user.use_whitelist === 1) {
        if (whiteLists.length > 0) {
          let isWhiteList = false

          whiteLists.forEach(wl => {
            if (wl.dataValues.ip === ctx.request.ip) isWhiteList = true
          })

          if (isWhiteList) {
            await PCLoginLogs.create({
              name: user.name,
              username,
              ip: ctx.request.ip,
              status: 0,
              remark: '用户厂内登录,允许登录' + extra_remark, uuid
            })

            ctx.response.type = 'json'
            ctx.response.body = { code: 0, data: 'user in whitelist' }
          } else {
            await PCLoginLogs.create({
              name: user.name,
              username,
              ip: ctx.request.ip,
              status: 1,
              remark: '用户非厂内登录,拒绝登录' + extra_remark, uuid
            })

            throw new Error('user not in whitelist')
          }
        } else {
          await PCLoginLogs.create({
            name: user.name,
            username,
            ip: ctx.request.ip,
            status: 0,
            remark: '用户厂内登录,允许登录' + extra_remark, uuid
          })

          ctx.response.type = 'json'
          ctx.response.body = { code: 0, data: 'no whitelist existed' }
        }
      } else {
        await PCLoginLogs.create({
          name: user.name,
          username,
          ip: ctx.request.ip,
          status: 0,
          remark: '用户有厂外登录权限,允许登录' + extra_remark, uuid
        })

        ctx.response.type = 'json'
        ctx.response.body = { code: 0, data: 'user not use whitelist' }
      }
    } catch (error) {
      console.log('error:', error)
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
