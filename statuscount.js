const Sequelize = require('sequelize')
const schedule = require('node-schedule');
const moment = require('moment');

module.exports = function (router, sequelize, logger) {

    logger.debug('Status_Count API Init...')

    var Status_Count = sequelize.define(
        'status_counts',
        {
            id: {
                type: Sequelize.STRING(100),
                primaryKey: true,
                autoIncrement: true
            },
            total_num: Sequelize.INTEGER(11),
            error_num: Sequelize.INTEGER(11),
            normal_num: Sequelize.INTEGER(11),
            detect_num: Sequelize.INTEGER(11),
        },
        {
            timestamps: true
        }
    )
    var Bugs_Count = sequelize.define(
        'bugs_counts',
        {
            id: {
                type: Sequelize.STRING(100),
                primaryKey: true,
                autoIncrement: true
            },
            total_num: Sequelize.INTEGER(11),
            close_num: Sequelize.INTEGER(11),
        },
        {
            timestamps: true
        }
    )
    function setScheduleJob() {
        schedule.scheduleJob('55 59 23 * * *', () => {
            logger.debug('每天的23:59:55点触发，去更新statuscount表 和 bugs_counts表'); ///一定要在当天的末尾
            insertStatusCount();
            insertBugsCount();
        });
    }
    async function insertStatusCount() {
        logger.debug('插入StatusCount表');
        let sqlText1 = `select des.status,count(des.status) as status_count from devices des where des.effective = 1 group by des.status`;
        let result = await sequelize.query(sqlText1);
        let allCount = 0;
        result[0].forEach((item) => {
            allCount += item.status_count
        })
        let startOfToday = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
        let endOfToday = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
        let sql = `select count(*) as todayDetectCount  from (select distinct rds.device_id from records rds
            where rds.createdAt > '${startOfToday}'and rds.createdAt < '${endOfToday}' and rds.effective = 1) t1`
        let result2 = await sequelize.query(sql);
        ///将当前结果插入到statuscount表中
        let dataObj = {
            total_num: allCount,
            normal_num: result[0][0].status_count,
            error_num: result[0][1].status_count,
            detect_num: result2[0][0].todayDetectCount,
        };
        // console.log(dataObj);//在一天结束的时刻 将当前的设备状态记录保存进表
        await Status_Count.create(dataObj)
        logger.debug('statuscount表新增完成');
    }
    async function insertBugsCount() {
        logger.debug('插入bugscount表');
        /// 获取今日解决的bug数量
        let todayStart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
        let todayEnd = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
        let sql1 = `select count(*) count from bugs
        where closedAt>'${todayStart}' and closedAt<'${todayEnd}' and effective = 1`
        let todayCloseBugNum = await sequelize.query(sql1);
        /// 获取今日创建的bug总数量
        let sql2 = `select count(*) count from bugs
            where createdAt>'${todayStart}' and createdAt<'${todayEnd}' and effective = 1`
        let todayBugNum = await sequelize.query(sql2);
        let dataObj = {
            close_num: todayCloseBugNum[0][0].count,
            total_num: todayBugNum[0][0].count
        }
        // console.log('dasdadasdas:', dataObj);
        await Bugs_Count.create(dataObj)
        logger.debug('bugscount表新增完成');
    }
    setScheduleJob();// 定时器
}