const Koa = require('koa')
const Sequelize = require('sequelize')
const config = require('./config')
const cors = require('koa2-cors');
const koaBody = require('koa-body')
const Router = require('koa-router');
const router = new Router();
const fs = require('fs')
const path = require('path')
const app = new Koa()
const uuidv1 = require('uuid/v1')
const send = require('koa-send');
const moment = require('moment');
const Core = require('@alicloud/pop-core');

var client = new Core({
  accessKeyId: 'LTAIKlkSwGRxGUs2',
  accessKeySecret: 'VwwbCrudDp7g2cDmk6vNBtiwcCliyV',
  endpoint: 'https://dysmsapi.aliyuncs.com',
  apiVersion: '2017-05-25'
});

var requestOption = {
  method: 'POST'
};

app.use(cors())
// app.use(koaBody({ multipart: true }));
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

//----------------------------------------------------User-----------------------------------------------------

var Users = sequelize.define(
  'users',
  {
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      autoIncrement: true
    },
    level_id: Sequelize.INTEGER(11),
    nfc_id: Sequelize.INTEGER(100),
    username: Sequelize.STRING(100),
    password: Sequelize.STRING(100),
    name: Sequelize.STRING(100),
    phonenumber: Sequelize.STRING(11)
  },
  {
    timestamps: true
  }
)
//----------------------------------------------------Nfc-----------------------------------------------------
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
//////////////////
router.post('/loginByUserInfo', async (ctx, next) => {
  try {
    let all = await Users.findAll({
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
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'find fault' }
  }
})

router.post('/loginByNFC', async (ctx, next) => {
  try {
    let nfcOne = await Nfcs.findOne({
      where: {
        nfcid: ctx.request.body.nfcid,
        type: ctx.request.body.type
      }
    })
    if (nfcOne) {
      // console.log('nfc表中存在这个卡的数据_id是：', nfcOne.dataValues.id);
      let userInfo = await Users.findOne({
        where: {
          nfc_id: nfcOne.dataValues.id
        }
      })
      if (userInfo) {
        // console.log('用户数据：', userInfo);
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
    console.log(error)
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
      // console.log('nfc表中存在这个卡的数据_id是：', nfcOne.dataValues.id);
      let deviceInfo = await Devices.findOne({
        where: {
          nfc_id: nfcOne.dataValues.id
        }
      })
      if (deviceInfo) {
        // console.log('deviceInfo::', deviceInfo);
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
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: '查询失败' }
  }
})

///////////////////
router.post('/insert_user', async (ctx, next) => {
  try {
    if (ctx.request.body.username == "" || ctx.request.body.password == "") {
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
      await Users.create(ctx.request.body)
      ctx.response.type = 'json'
      ctx.response.body = { code: 0, data: 'success' }
    }
  } catch (error) {
    console.log(error)
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
    console.log(error)
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
    console.log(error)
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
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'update fault' }
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
    console.log(error)
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
    console.log(error)
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
    console.log(error)
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
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'update fault' }
  }
})
//----------------------------------------------------Devices-----------------------------------------------------
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
///////////////////
router.post('/insert_device', async (ctx, next) => {
  try {
    await Devices.create(ctx.request.body)
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'success' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'fault' }
  }
})
router.post('/find_device', async (ctx, next) => {
  try {
    let all = await Devices.findAll({
      where: ctx.request.body
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: all }
  } catch (error) {
    console.log(error)
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
    console.log(error)
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
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'update fault' }
  }
})
//----------------------------------------------------Device_Types-----------------------------------------------------
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
///////////////////
router.post('/insert_device_type', async (ctx, next) => {
  try {
    await Device_Types.create(ctx.request.body)
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'success' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'fault' }
  }
})
router.post('/find_device_type', async (ctx, next) => {
  try {
    let all = await Device_Types.findAll({
      where: ctx.request.body
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: all }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'find fault' }
  }
})
router.post('/remove_device_type', async (ctx, next) => {
  try {
    await Device_Types.destroy({
      where: ctx.request.body
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'remove sucess' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'remove fault' }
  }
})
router.post('/update_device_type', async (ctx, next) => {
  try {
    await Device_Types.update(ctx.request.body.update, {
      where: ctx.request.body.query
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'update success' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'update fault' }
  }
})
//----------------------------------------------------Areas-----------------------------------------------------
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
///////////////////
router.post('/insert_area', async (ctx, next) => {
  try {
    await Areas.create(ctx.request.body)
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'success' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'fault' }
  }
})
router.post('/find_area', async (ctx, next) => {
  try {
    let all = await Areas.findAll({
      where: ctx.request.body
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: all }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'find fault' }
  }
})
router.post('/remove_area', async (ctx, next) => {
  try {
    await Areas.destroy({
      where: ctx.request.body
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'remove sucess' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'remove fault' }
  }
})
router.post('/update_area', async (ctx, next) => {
  try {
    await Areas.update(ctx.request.body.update, {
      where: ctx.request.body.query
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'update success' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'update fault' }
  }
})
//----------------------------------------------------Samples-----------------------------------------------------
var Samples = sequelize.define(
  'samples',
  {
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      autoIncrement: true
    },
    device_type_id: Sequelize.INTEGER(11),
    table_name: Sequelize.STRING(100),
    content: Sequelize.STRING(100),
  },
  {
    timestamps: true
  }
)
///////////////////
router.post('/insert_sample', async (ctx, next) => {
  try {
    await Samples.create(ctx.request.body)
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'success' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'fault' }
  }
})
router.post('/find_sample', async (ctx, next) => {
  try {
    let all = await Samples.findAll({
      where: ctx.request.body
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: all }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'find fault' }
  }
})
router.post('/remove_sample', async (ctx, next) => {
  try {
    await Samples.destroy({
      where: ctx.request.body
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'remove sucess' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'remove fault' }
  }
})
router.post('/update_sample', async (ctx, next) => {
  try {
    await Samples.update(ctx.request.body.update, {
      where: ctx.request.body.query
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'update success' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'update fault' }
  }
})
//----------------------------------------------------Records-----------------------------------------------------
var Records = sequelize.define(
  'records',
  {
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      autoIncrement: true
    },
    device_status: Sequelize.INTEGER(11),
    device_id: Sequelize.INTEGER(11),
    device_type_id: Sequelize.INTEGER(11),
    table_name: Sequelize.STRING(100),
    content: Sequelize.STRING(100),
    user_id: Sequelize.INTEGER(11),
  },
  {
    timestamps: true
  }
)
///////////////////
router.post('/insert_record', async (ctx, next) => {
  try {
    let copyRequsetBody = JSON.parse(JSON.stringify(ctx.request.body));
    let content = JSON.parse(copyRequsetBody.content);
    // console.log('初始化数据：',content);
    let contentAfterTrans = await transformHandler(content);
    ctx.request.body.content = JSON.stringify(contentAfterTrans);
    // console.log('我最后的返回值结果：', ctx.request.body);
    // return;
    await Records.create(ctx.request.body)
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'success' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'fault' }
  }
})

async function transformHandler(content) {
  // console.log("初始数据：" + JSON.stringify(content));
  for (let element of content) {
    if (element.type_id === "6" && element.value.length > 0) {  ///图片base64数组
      // console.log('图片数据：',element.value, typeof element.value);///array
      let newPathValueArr = await writeImages(element.value);
      // console.log("处理后的数组：",newPathValueArr);
      element.value = newPathValueArr;////["路径1","路径2",....]
    }
  };
  return content;
}
async function writeImages(imageArr) {
  let pathArr = [];
  for (const item of imageArr) {
    try { ////捕获Promise的异常
      let OneImgPath = await writeOneImg(item);
      pathArr.push(OneImgPath);
    } catch (error) {
      console.log('error:' + error);
      return [];
    }
  }
  // console.log('全部写入成功', pathArr);
  return pathArr;
}
function writeOneImg(item) {
  ////最底层的异步操作，要包含在Promise方法中。用于直接调用 resolve 或 reject
  let p = new Promise(function (resolve, reject) {        //做一些异步操作
    let oneImgPath = '/Users/fangchao/Desktop/imageKU/' + new Date().getTime() + '.jpg';
    var base64Data = item.replace(/^data:image\/\w+;base64,/, "");
    let dataBuffer = new Buffer(base64Data, 'base64'); //把base64码转成buffer对象，
    fs.writeFile(oneImgPath, dataBuffer, function (err) {//用fs写入文件
      if (err) { reject('写入图片失败') }
      else {
        resolve(oneImgPath)
      }
    })
  });
  return p;
}
///////////////////////
router.post('/find_record', async (ctx, next) => {
  try {
    let all = await Records.findAll({
      where: ctx.request.body
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: all }
  } catch (error) {
    console.log(error)
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
    console.log(error)
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
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'update fault' }
  }
})

//----------------------------------------------------Levels-----------------------------------------------------
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
    console.log(error)
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
    console.log(error)
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
    console.log(error)
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
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'update fault' }
  }
})
//----------------------------------------------------Tasks-----------------------------------------------------
var Tasks = sequelize.define(
  'tasks',
  {
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      autoIncrement: true
    },
    from: Sequelize.INTEGER(11),
    to: Sequelize.STRING(100),
    status: Sequelize.INTEGER(1),
    title: Sequelize.STRING(100),
    content: Sequelize.STRING(100),
    overTime: Sequelize.STRING(100)
  },
  {
    timestamps: true
  }
)
///////////////////
router.post('/insert_task', async (ctx, next) => {
  try {
    await Tasks.create(ctx.request.body)
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'success' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'fault' }
  }
})
router.post('/find_task', async (ctx, next) => {
  try {
    let all = await Tasks.findAll({
      where: ctx.request.body
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: all }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'find fault' }
  }
})
router.post('/remove_task', async (ctx, next) => {
  try {
    await Tasks.destroy({
      where: ctx.request.body
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'remove sucess' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'remove fault' }
  }
})
router.post('/update_task', async (ctx, next) => {
  try {
    await Tasks.update(ctx.request.body.update, {
      where: ctx.request.body.query
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'update success' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'update fault' }
  }
})
//----------------------------------------------------Problems-----------------------------------------------------
var Problems = sequelize.define(
  'problems',
  {
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      autoIncrement: true
    },
    user_id: Sequelize.INTEGER(11),
    warning_level: Sequelize.INTEGER(11),
    remark: Sequelize.STRING(100),
    status: Sequelize.INTEGER(11),
  },
  {
    timestamps: true
  }
)
///////////////////
router.post('/insert_problem', async (ctx, next) => {
  try {
    let copyData = JSON.parse(JSON.stringify(ctx.request.body))
    let remark = JSON.parse(copyData.remark)
    let imgsArr = remark.imgs
    let imgsPathArr = [];
    if (imgsArr.length > 0) {
      imgsPathArr = await writeImages(imgsArr)
    }
    remark.imgs = imgsPathArr;
    ctx.request.body.remark = JSON.stringify(remark);
    await Problems.create(ctx.request.body)
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'success' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'fault' }
  }
})
router.post('/find_problem', async (ctx, next) => {
  try {
    let all = await Problems.findAll({
      where: ctx.request.body
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: all }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'find fault' }
  }
})
router.post('/remove_problem', async (ctx, next) => {
  try {
    await Problems.destroy({
      where: ctx.request.body
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'remove sucess' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'remove fault' }
  }
})
router.post('/update_problem', async (ctx, next) => {
  try {
    await Problems.update(ctx.request.body.update, {
      where: ctx.request.body.query
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'update success' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'update fault' }
  }
})

router.post('/sendMessageToStaffs', async (ctx, next) => {
  try {
    console.log("监听到短信请求：", ctx.request.body);
    let paramArr = ctx.request.body;
    paramArr.forEach(element => {
      let phonenumber = element.phonenumber;
      delete element.phonenumber
      let params = {
        "PhoneNumbers": phonenumber,
        "SignName": "中节能合肥",
        "TemplateCode": "SMS_166096683",
        "TemplateParam": JSON.stringify(element)
      }
      client.request('SendSms', params, requestOption).then((result) => {
        console.log(result);
      }, (ex) => {
        console.log(ex);
      })
    });
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'update success' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'update fault' }
  }
})

router.post('/sendMessageToLeader', async (ctx, next) => {
  try {
    console.log("监听到回馈短信请求：", ctx.request.body);
    let paramObj = ctx.request.body;
    let phonenumber = paramObj.phonenumber;
    delete paramObj.phonenumber
    let params = {
      "PhoneNumbers": phonenumber,
      "SignName": "中节能合肥",
      "TemplateCode": "SMS_166081562",
      "TemplateParam": JSON.stringify(paramObj)
    }
    client.request('SendSms', params, requestOption).then((result) => {
      console.log(result);
    }, (ex) => {
      console.log(ex);
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, data: 'update success' }
  } catch (error) {
    console.log(error)
    ctx.response.type = 'json'
    ctx.response.body = { code: -1, data: 'update fault' }
  }
})


app.listen(3009)
console.log('app started at port 3009...')
