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
const problemInit = require('./problem')
const recordInit = require('./record')
const sampleInit = require('./sample')
const smsInit = require('./sms')
const taskInit = require('./task')
const userInit = require('./user')
const statuscountInit = require('./statuscount')
const push = require('./push')
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
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      idle: 30000
    }
  }
)

router.get('/version_update', async (ctx, next) => {
  ctx.response.type = 'json'
  ctx.response.body = { code: 0, vn: '0.0.3' }
})

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
statuscountInit(router, sequelize, logger)
push(router, sequelize, logger)

router.post('/obs', async (ctx, next) => {
  try {
    // console.log("sql语句：",ctx.request.body.sql);
    let result = await sequelize.query(ctx.request.body.sql);
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: result[0] }
  } catch (error) {
    logger.debug(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'operate fault' }
  }
})

////获取所有设备   相对今日的所有参与提交record的人员的 记录情况
router.post('/getEveryUserRecordToday', async (ctx, next) => {
  try {
    // console.log("sql语句：",ctx.request.body.sql);
    let dayOfBegin = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');///今日启始时刻
    let dayOfEnd = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');///今日结束时刻
    // console.log(dayOfBegin, dayOfEnd);
    let sqlText1 = "select tt1.*,users.name,des.id as device_id from" +
      " devices des, (select rds.user_id from records rds " +
      " where createdAt>'" + dayOfBegin + "' and createdAt<'" + dayOfEnd + "' group by rds.user_id) tt1 left join users on tt1.user_id = users.id"
    let result = await sequelize.query(sqlText1);
    ctx.response.type = 'json'
    // console.log('返回值', result[0]);///得到的返回值 是[{user_id:x,device_id:y},...]集合数组
    let resultArr = [];
    if (result[0].length > 0) {
      for (const item of result[0]) {
        let tempSqlText = "select tt1.*,users.name as user_name from (select rds.device_id,rds.user_id,rds.device_status,rds.id as record_id from records rds" +
          " where rds.user_id = " + item.user_id + " and rds.device_id = " + item.device_id +
          " and createdAt>'" + dayOfBegin + "' and createdAt<'" + dayOfEnd + "'" +
          " order by rds.id desc limit 1) tt1 left join users on tt1.user_id = users.id"
        let tempresult = await sequelize.query(tempSqlText);
        let a;
        if (!tempresult[0][0]) {
          a = { device_id: item.device_id, user_id: item.user_id, device_status: null, record_id: null, user_name: item.name }
        } else {
          a = JSON.parse(JSON.stringify(tempresult[0][0]));
        }
        resultArr.push(a);
      }
      // console.log('查询结果：',resultArr);
    }
    ctx.response.body = { code: 0, data: resultArr }
  } catch (error) {
    logger.debug(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'operate fault' }
  }
})

app.listen(3009)
logger.debug('app started at port 3009...')