const Koa = require('koa')
const Sequelize = require('sequelize')
const config = require('./config')
const cors = require('koa2-cors');
const koaBody = require('koa-body')
const Router = require('koa-router');
const compress = require('koa-compress');
const moment = require('moment');
const router = new Router();
const app = new Koa()
const options = { threshold: 2048 }
app.use(compress(options))

const areaInit = require('./area')
const bugInit = require('./bug')
const deviceInit = require('./device')
const devicetypeInit = require('./devicetype')
const levelInit = require('./level')
const nfcInit = require('./nfc')
const recordInit = require('./record')
const sampleInit = require('./sample')
const smsInit = require('./sms')
const taskInit = require('./task')
const userInit = require('./user')
const buglevelInit = require('./buglevel')
const statuscountInit = require('./statuscount')
const push = require('./push')
const smsNewInit = require('./smsNew')
const customizeInt = require('./util/Customize')
const { findDurtion } = require('./util/Tool')
//----------------------------------------------------------------------------------------------------------------
//  增加日志文件输出
//----------------------------------------------------------------------------------------------------------------
const log4js = require('log4js')
log4js.configure({
  appenders: {
    app: { type: 'file', filename: 'app.log' }
  },
  categories: { default: { appenders: ['app'], level: 'debug' } }
})
const logger = log4js.getLogger('xiaomu')

app.use(cors())
app.use(koaBody({ multipart: true }));
app.use(router.routes()).use(router.allowedMethods());

var sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      idle: 30000
    },
    timezone: '+08:00'
  }
)

router.get('/version_update', async (ctx, next) => {
  ctx.response.type = 'json'
  ctx.response.body = { code: 0, vn: '0.1.6' }
})

customizeInt(router, sequelize, logger)
areaInit(router, sequelize, logger)
bugInit(router, sequelize, logger)
deviceInit(router, sequelize, logger)
devicetypeInit(router, sequelize, logger)
levelInit(router, sequelize, logger)
nfcInit(router, sequelize, logger)
recordInit(router, sequelize, logger)
sampleInit(router, sequelize, logger)
smsInit(router, sequelize, logger)
taskInit(router, sequelize, logger)
userInit(router, sequelize, logger)
statuscountInit(router, sequelize, logger)
push(router, sequelize, logger)
buglevelInit(router, sequelize, logger)
smsNewInit(router, sequelize, logger);

app.listen(3008)
logger.debug('app started at port 3008...')