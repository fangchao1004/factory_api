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
    }
  }
)

router.get('/version_update', async (ctx, next) => {
  ctx.response.type = 'json'
  ctx.response.body = { code: 0, vn: '0.1.5' }
})

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
    let sqlText1 = `select tt1.*,users.name,des.id as device_id from
      devices des, (select rds.user_id from records rds 
      where createdAt>'${dayOfBegin}' and createdAt<'${dayOfEnd}' and effective = 1 group by rds.user_id) tt1 
      left join (select * from users) users on tt1.user_id = users.id
      where des.effective = 1`
    let result = await sequelize.query(sqlText1);
    ctx.response.type = 'json'
    // console.log('返回值', result[0].length);///得到的返回值 是[{user_id:x,device_id:y},...]集合数组
    let resultArr = [];
    if (result[0].length > 0) {
      for (const item of result[0]) {
        let tempSqlText = `select tt1.*,users.name as user_name from (select rds.device_id,rds.user_id,rds.device_status,rds.id as record_id from records rds
          where rds.user_id = ${item.user_id} and rds.device_id = ${item.device_id}
          and createdAt>'${dayOfBegin}' and createdAt<'${dayOfEnd}' and effective = 1
          order by rds.id desc limit 1) tt1 left join users on tt1.user_id = users.id`
        let tempresult = await sequelize.query(tempSqlText);
        let a;
        if (!tempresult[0][0]) {
          a = { device_id: item.device_id, user_id: item.user_id, device_status: null, record_id: null, user_name: item.name }
        } else {
          a = JSON.parse(JSON.stringify(tempresult[0][0]));
        }
        if (a) { resultArr.push(a) }
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

/**
 * 查找那些关于我的缺陷
 */
router.post('/findBugsAboutMe', async (ctx, next) => {
  try {
    let currentUserId = parseInt(ctx.request.body.userId);
    let isCompleted = parseInt(ctx.request.body.isCompleted);
    let marjor_id = parseInt(ctx.request.body.major_id); /// 要么存在 要么 NaN
    let buglevel = parseInt(ctx.request.body.buglevel); /// 要么存在 要么 NaN
    let bug_type_id = parseInt(ctx.request.body.bug_type_id); /// 要么存在 要么 NaN
    let marjorStr = marjor_id ? `and major_id = ${marjor_id} ` : ``
    let buglevelStr = buglevel ? `and buglevel = ${buglevel} ` : ``
    let bugTypeStr = bug_type_id ? `and bug_type_id = ${bug_type_id} ` : ``
    let sqlText = `
    select * from
    (select bugs.*,des.name as device_name,urs.name as user_name,mjs.name as major_name,
      concat_ws('/',area_1.name,area_2.name,area_3.name) as area_name,
      bug_types.name as bug_type_name
      from bugs
        left join (select * from devices where effective = 1) des on bugs.device_id = des.id
        left join (select * from users where effective = 1) urs on bugs.user_id = urs.id
        left join (select * from majors where effective = 1) mjs on bugs.major_id = mjs.id
        left join (select * from area_3 where effective = 1) area_3 on des.area_id = area_3.id
        left join (select * from area_2 where effective = 1) area_2 on area_3.area2_id = area_2.id
        left join (select * from area_1 where effective = 1) area_1 on area_2.area1_id = area_1.id
        left join (select * from bug_types where effective = 1) bug_types on bug_types.id = bugs.bug_type_id
        ) t1
    where
    remark like '%"from":${currentUserId},%' and  effective = 1 and status ${isCompleted === 0 ? `!=` : `=`} 4 ${marjorStr} ${buglevelStr} ${bugTypeStr}
    or remark like '%"to":[%,${currentUserId},%]%' and  effective = 1 and status ${isCompleted === 0 ? `!=` : `=`} 4 ${marjorStr} ${buglevelStr} ${bugTypeStr}
    `
    let result = await sequelize.query(sqlText);
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: result[0] }
  } catch (error) {
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'operate fault' }
  }
})

function unique(arr) {
  return Array.from(new Set(arr))
}

app.listen(3008)
logger.debug('app started at port 3008...')