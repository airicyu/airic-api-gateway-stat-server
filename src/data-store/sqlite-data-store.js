const mysql = require('mysql');

const dataStore = {
    _db: null,
    registerDB: null,
    onStatEvent: null,
    aueryAppStat: null,
    queryAppOperationStat: null,
    queryClientStatGroupbyAppOp: null
}

dataStore.registerDB = function (db) {
    this._db = db;
}.bind(dataStore);


dataStore.onStatEvent = async function (statEvent) {
    let db = this._db;

    return new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO `stat_event` (`statRecordEventId`, `gatewayNodeId`, `eventTime`, `recordStart`, `recordEnd`) VALUES (?, ?, ?, ?, ?)', [statEvent.statRecordEventId, statEvent.gatewayNodeId, statEvent.eventTime, statEvent.recordStart, statEvent.recordEnd], function (error) {
            if (error) {
                return reject(error);
            }
            let records = statEvent.records.map((record) => {
                return [statEvent.statRecordEventId, record.bucketType, record.bucketStart, record.bucketEnd, record.bucketIndex, record.appId, record.opId, record.clientId, record.count];
            });

            db.serialize(function() {
                for(let record of records){
                    db.run('INSERT OR REPLACE INTO `stat_record` (`statRecordEventId`, `bucketType`, `bucketStart`, `bucketEnd`, `bucketIndex`, `appId`, `opId`, `clientId`, `count`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', record);
                }
            });
            return resolve();
        });
    });
}.bind(dataStore);


dataStore.queryAppStatGroupbyOpClient = async function ({ appId, bucketStart, bucketEnd }) {
    let db = this._db;

    return new Promise((resolve, reject) => {
        db.all("SELECT `opId`, `clientId`, SUM(`count`) AS `count` FROM `stat_record` WHERE `appId` = ? AND `bucketStart` >= ? AND `bucketEnd` <= ? GROUP BY `opId`, `clientId`", [appId, bucketStart, bucketEnd], function (error, rows) {
            if (error) {
                return reject(error);
            } else {
                return resolve(rows);
            }
        });
    }).then((results) => {
        let response = {}
        if (results) {
            response = results.map(_ => {
                let { opId, clientId, count } = _;
                return { opId, clientId, count };
            });
        }
        return response;
    });
}.bind(dataStore);

dataStore.queryClientStatGroupbyAppOp = async function ({ clientId, bucketStart, bucketEnd }) {
    let db = this._db;

    return new Promise((resolve, reject) => {
        db.all("SELECT `appId`, `opId`, SUM(`count`) AS `count` FROM `stat_record` WHERE `clientId` = ? AND `bucketStart` >= ? AND `bucketEnd` <= ? GROUP BY `appId`, `opId`", [clientId, bucketStart, bucketEnd], function (error, rows) {
            if (error) {
                return reject(error);
            } else {
                return resolve(rows);
            }
        });
    }).then((results) => {
        let response = {}
        if (results) {
            response = results.map(_ => {
                let { appId, opId, count } = _;
                return { appId, opId, count };
            });
        }
        return response;
    });
}.bind(dataStore);

module.exports.dataStore = dataStore;