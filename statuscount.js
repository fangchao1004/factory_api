const Sequelize = require('sequelize')
const schedule = require('node-schedule');

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
            normal_num: Sequelize.INTEGER(11)
        },
        {
            timestamps: true
        }
    )
    function setScheduleJob() {
        schedule.scheduleJob('55 59 23 * * *', () => {
            logger.debug('每天的23:59:55点触发，去更新statuscount表');
            doAction();
        });
    }
    async function doAction() {
        let sqlText1 = 'select des.status,count(des.status) as status_count from devices des group by des.status';
        let result = await sequelize.query(sqlText1);
        let allCount = 0;
        result[0].forEach((item) => {
            allCount += item.status_count
        })
        ///将当前结果插入到statuscount表中
        let dataObj = {
            total_num: allCount,
            normal_num: result[0][0].status_count,
            error_num: result[0][1].status_count,
        };
        // console.log(dataObj);//在一天结束的时刻 将当前的设备状态记录保存进表
        await Status_Count.create(dataObj)
    }
    setScheduleJob();// 定时器
}