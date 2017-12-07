const mysql = require('mysql');

const dataStore = {
    _pool: null,
    registerConnectionPool: null,
    getConnection: null,
    onStatEvent: null,
    aueryAppStat: null,
    queryAppOperationStat: null,
    queryClientStatGroupbyAppOp: null
}

dataStore.registerConnectionPool = function (pool) {
    this._pool = pool;
}.bind(dataStore);

dataStore.getConnection = async function () {
    let pool = this._pool;
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) {
                return reject(err);
            } else {
                return resolve(connection);
            }
        });
    });
}.bind(dataStore);


dataStore.onStatEvent = async function (statEvent) {
    let connection = await this.getConnection();

    return new Promise((resolve, reject) => {
        connection.beginTransaction(function (err) {
            if (err) {
                return reject(err);
            }
            connection.query('INSERT INTO `stat_event` (`statRecordEventId`, `gatewayNodeId`, `eventTime`, `recordStart`, `recordEnd`) VALUES (?, ?, ?, ?, ?)', [statEvent.statRecordEventId, statEvent.gatewayNodeId, statEvent.eventTime, statEvent.recordStart, statEvent.recordEnd], function (error, results, fields) {
                if (error) {
                    return connection.rollback(function () {
                        return reject(error);
                    });
                }
                let records = statEvent.records.map((record) => {
                    return [statEvent.statRecordEventId, record.bucketType, record.bucketStart, record.bucketEnd, record.bucketIndex, record.appId, record.opId, record.clientId, record.count];
                });

                connection.query('INSERT INTO `stat_record` (`statRecordEventId`, `bucketType`, `bucketStart`, `bucketEnd`, `bucketIndex`, `appId`, `opId`, `clientId`, `count`) VALUES ?', [records], function (error, results, fields) {
                    if (error) {
                        return connection.rollback(function () {
                            return reject(error);
                        });
                    }
                    connection.commit(function (err) {
                        if (err) {
                            return connection.rollback(function () {
                                return reject(err);
                            });
                        }
                        connection.release();
                        return resolve();
                    });
                });
            });
        });
    }).catch((err) => {
        connection.release();
        return Promise.reject(err);
    });
}.bind(dataStore);


dataStore.queryAppStatGroupbyOpClient = async function ({ appId, bucketStart, bucketEnd }) {
    let connection = await this.getConnection();

    return new Promise((resolve, reject) => {
        connection.query("SELECT `opId`, `clientId`, SUM(`count`) AS `count` FROM `stat_record` WHERE `appId` = ? AND `bucketStart` >= ? AND `bucketEnd` <= ? GROUP BY `opId`, `clientId`", [appId, bucketStart, bucketEnd], function (error, results, fields) {
            connection.release();
            if (error) {
                return reject(error);
            } else {
                return resolve(results);
            }
        });
    }).then((results) => {
        let response = {}
        if (results){
            response = results.map(_=>{
                let {opId, clientId, count} = _;
                return {opId, clientId, count};
            });
        }
        return response;
    });
}.bind(dataStore);

dataStore.queryClientStatGroupbyAppOp = async function ({ clientId, bucketStart, bucketEnd }) {
    let connection = await this.getConnection();

    return new Promise((resolve, reject) => {
        connection.query("SELECT `appId`, `opId`, SUM(`count`) AS `count` FROM `stat_record` WHERE `clientId` = ? AND `bucketStart` >= ? AND `bucketEnd` <= ? GROUP BY `appId`, `opId`", [clientId, bucketStart, bucketEnd], function (error, results, fields) {
            connection.release();
            if (error) {
                return reject(error);
            } else {
                return resolve(results);
            }
        });
    }).then((results) => {
        let response = {}
        if (results){
            response = results.map(_=>{
                let {appId, opId, count} = _;
                return {appId, opId, count};
            });
        }
        return response;
    });
}.bind(dataStore);

module.exports.dataStore = dataStore;