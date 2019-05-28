const Koa = require('koa')
const Sequelize = require('sequelize')
const config = require('./config')
const cors = require('koa2-cors');
const koaBody = require('koa-body')
const Router = require('koa-router');
const router = new Router();
const app = new Koa()

const areaInit = require('./area')
const bugInit = require('./bug')
const deviceInit = require('./device')
const devicetypeInit = require('./devicetype')
const levelInit = require('./level')
const nfcInit = require('./nfc')
const problemInit = require('./problem')
const recordInit = require('./record')
const sampleInit = require('./sample')
const smsInit = require('./sms')
const taskInit = require('./task')
const userInit = require('./user')

//----------------------------------------------------------------------------------------------------------------
//  增加日志文件输出
//----------------------------------------------------------------------------------------------------------------
const log4js = require('log4js')
log4js.configure({
  appenders: { app: { type: 'file', filename: 'app.log' } },
  categories: { default: { appenders: ['app'], level: 'debug' } }
})
const logger = log4js.getLogger('xiaomu')

app.use(cors())
app.use(koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 2000 * 1024 * 1024    // 设置上传文件大小最大限制，20M
  }
}));
app.use(router.routes()).use(router.allowedMethods());

var sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      idle: 30000
    }
  }
)

areaInit(router, sequelize, logger)
bugInit(router, sequelize, logger)
deviceInit(router, sequelize, logger)
devicetypeInit(router, sequelize, logger)
levelInit(router, sequelize, logger)
nfcInit(router, sequelize, logger)
problemInit(router, sequelize, logger)
recordInit(router, sequelize, logger)
sampleInit(router, sequelize, logger)
smsInit(router, sequelize, logger)
taskInit(router, sequelize, logger)
userInit(router, sequelize, logger)
app.listen(3009)

logger.debug('app started at port 3009...')

