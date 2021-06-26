/**
 * 自定义的一些复杂的，需要多表联合查询，数据拼接处理的操作接口
 */
module.exports = function (router, sequelize, logger) {
  logger.debug('Customize API Init...')
  router.post('/obs', async (ctx, next) => {
    try {
      console.log("sql语句：", ctx.request.body.sql);
      let result = await sequelize.query(ctx.request.body.sql);
      ctx.response.type = 'json'
      ctx.response.body = { code: 0, data: result[0] }
    } catch (error) {
      logger.debug(error)
      console.log('error:', error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'operate fault', des: error }
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

  ////获取所有设备   相对今日的所有参与提交record的人员的 记录情况
  router.post('/getEveryUserRecordToday', async (ctx, next) => {
    try {
      // console.log("sql语句：",ctx.request.body.sql);
      let dayOfBegin = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');///今日启始时刻
      let dayOfEnd = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');///今日结束时刻
      /// 首先根据当前时间，和巡检时间表，得出当前哪些设备应该被巡检
      let getAllowTimeListSql = `select allow_time.id,allow_time.begin,allow_time.end,allow_time.isCross,allow_time.name from allow_time where allow_time.effective = 1`
      let allowTimeListresult = await sequelize.query(getAllowTimeListSql);
      let currentTimeDurtion = findDurtion(allowTimeListresult[0])///查询到当前时间段 对应的时间区间表数据
      /// 新的 查询sql语句 ，根据时间段查询对应的device
      let sqlText1 = `select tt1.*,users.name,des.device_id as device_id from
     (select a_m_d.device_id,a_m_d.effective from allow_time a_t
     left join (select * from allowTime_map_device where effective = 1) a_m_d on a_t.id = a_m_d.allow_time_id
     where a_t.id = ${currentTimeDurtion.id}) des, (select rds.user_id from records rds 
     where createdAt>'${dayOfBegin}' and createdAt<'${dayOfEnd}' and effective = 1 group by rds.user_id) tt1 
     left join (select * from users) users on tt1.user_id = users.id`
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
  router.post('/getSampleWithSchemeInfo', async (ctx, next) => {
    try {
      let sampleIdList = ctx.request.body.id;
      let area0_id = ctx.request.body.area0_id || 1;
      /// 第一步先获取所有的项目和方案的映射关系表
      let sql1 = `select sche_cyc_atm_map_sample.*, scheme_of_cycleDate.title as date_title,  scheme_of_cycleDate.cycleDate_id,sche_cyc_map_date.date_value,scheme_of_allowTime.title as allowTime_title,allow_time.begin,
      allow_time.end,allow_time.isCross,allow_time.name as atm_type_name   from sche_cyc_atm_map_sample
      left join (select * from scheme_of_cycleDate where effective = 1) scheme_of_cycleDate on scheme_of_cycleDate.id = sche_cyc_atm_map_sample.cyc_scheme_id
      left join (select * from sche_cyc_map_date where effective = 1) sche_cyc_map_date on sche_cyc_map_date.scheme_id = sche_cyc_atm_map_sample.cyc_scheme_id
      left join (select * from scheme_of_allowTime where effective = 1) scheme_of_allowTime on scheme_of_allowTime.id = sche_cyc_atm_map_sample.atm_scheme_id
      left join (select * from sche_atm_map_time where effective = 1) sche_atm_map_time on sche_atm_map_time.scheme_id = sche_cyc_atm_map_sample.atm_scheme_id
      left join (select * from allow_time where effective = 1) allow_time on allow_time.id = sche_atm_map_time.allowTime_id
      where sche_cyc_atm_map_sample.effective = 1
      order by sample_id,key_id`
      let addSql = ``;
      if (sampleIdList && sampleIdList.length > 0) { addSql = `and id in (${sampleIdList.join(',')})` }
      let sql2 = `select samples.*,device_types.name as device_type_name from samples
      left join (select * from device_types where effective = 1) device_types on device_types.id = samples.device_type_id
      where samples.effective = 1 ${addSql} and samples.area0_id = ${area0_id}
      order by samples.id`
      let resultOfScheme = await sequelize.query(sql1);
      let resultOfSample = await sequelize.query(sql2);
      let resultOfSchemeGroupBy = transformData(resultOfScheme[0]);
      let finaResult = bindTwoData(resultOfSchemeGroupBy, resultOfSample[0]);///将方案数据和sample数据进行关联
      ctx.response.type = 'json'
      ctx.response.body = { code: 0, data: finaResult }
    } catch (error) {
      logger.debug(error)
      ctx.response.type = 'json'
      ctx.response.body = { code: -1, data: 'operate fault' }
    }
  })
  function bindTwoData(resultOfSchemeGroupBy, resultOfSample) {
    resultOfSample.forEach((oneSampleItem) => {
      resultOfSchemeGroupBy.forEach((oneSchemeGroupByItem) => {
        if (oneSchemeGroupByItem.sample_id === oneSampleItem.id) { oneSampleItem.scheme_data = oneSchemeGroupByItem.scheme_with_key }
      })
    })
    return resultOfSample;
  }
  let newListGroupBySampleId = [];
  let subListGroupByKeyId = [];
  function transformData(orignData) {
    newListGroupBySampleId.length = subListGroupByKeyId.length = 0;
    if (orignData.length > 0) {
      ///先根据 sample_id 进行分组
      orignData.forEach((item) => {
        let indexNum = existedIndex(item.sample_id);
        let sample_id = item.sample_id;
        let device_type_id = item.device_type_id;
        delete item.sample_id;
        delete item.effective;
        delete item.device_type_id;
        if (indexNum === -1) { ///如果不存在就开辟一个新的对象
          newListGroupBySampleId.push({
            sample_id: sample_id,
            device_type_id: device_type_id,
            scheme_list: [item]
          })
        } else {///如果存在就要push到已有的末尾
          newListGroupBySampleId[indexNum].scheme_list.push(item);
        }
      })
      // console.log(newListGroupBySampleId)///到此步骤 已经按照sample_id进行了分类。
      ///还对每个sample中的scheme_list 进行 key_id 的分组
      let copyData = JSON.parse(JSON.stringify(newListGroupBySampleId));
      copyData.forEach((oneSampleItem) => {
        subListGroupByKeyId.length = 0;///每次
        let scheme_list = oneSampleItem.scheme_list;
        scheme_list.forEach((oneSchemeItem) => {
          let indexNum = existedIndex2(oneSchemeItem.key_id);
          let key_id = oneSchemeItem.key_id;
          delete oneSchemeItem.id;
          delete oneSchemeItem.key_id;
          if (indexNum === -1) { ///如果不存在就开辟一个新的对象
            subListGroupByKeyId.push({
              key_id: key_id,
              scheme_info: [oneSchemeItem]
            })
          } else {///如果存在就要push到已有的末尾
            subListGroupByKeyId[indexNum].scheme_info.push(oneSchemeItem);
          }
          oneSampleItem.scheme_with_key = JSON.parse(JSON.stringify(subListGroupByKeyId));
        })
        delete oneSampleItem.scheme_list
      })
      // console.log("copyData:", copyData)///到此步骤 已经按照sample_id进行了分类。
      return copyData;
    } else { return orignData; }
  }
  function existedIndex(sample_id) {
    let indexNum = -1;
    newListGroupBySampleId.forEach((item, index) => {
      if (item.sample_id === sample_id) { isExisted = true, indexNum = index }
    })
    return indexNum;
  }
  function existedIndex2(key_id) {
    let indexNum = -1;
    subListGroupByKeyId.forEach((item, index) => {
      if (item.key_id === key_id) { isExisted = true, indexNum = index }
    })
    return indexNum;
  }
}