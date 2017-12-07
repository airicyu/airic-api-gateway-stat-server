'use strict';

const dataStore = {
    _eventMap: {},
    _statRecords: [],
    onStatEvent: null,
    aueryAppStat: null,
    queryAppOperationStat: null,
    queryClientStatGroupbyAppOp: null
}

dataStore.onStatEvent = async function (statEvent) {

    let eventMap = this._eventMap;
    let statRecords = this._statRecords;

    return new Promise((resolve, reject) => {
        if (eventMap[statEvent.statRecordEventId]) {
            return reject();
        } else {
            eventMap[statEvent.statRecordEventId] = statEvent;
            let records = statEvent.records.map((record) => {
                return {
                    statRecordEventId: statEvent.statRecordEventId,
                    bucketType: record.bucketType,
                    bucketStart: record.bucketStart,
                    bucketEnd: record.bucketEnd,
                    bucketIndex: record.bucketIndex,
                    appId: record.appId,
                    opId: record.opId,
                    clientId: record.clientId,
                    count: record.count
                };
            });
            for (let record of records) {
                statRecords.push(record);
            }
            return resolve();
        }
    });
}.bind(dataStore);


dataStore.queryAppStatGroupbyOpClient = async function ({ appId, bucketStart, bucketEnd }) {

    let statRecords = this._statRecords;

    let tempRecords = {};
    statRecords.filter((record) => {
        return record.appId === appId && record.bucketStart >= bucketStart && record.bucketEnd <= bucketEnd;
    }).forEach(record => {
        tempRecords[record.opId] = tempRecords[record.opId] || {};
        tempRecords[record.opId][record.clientId] = tempRecords[record.opId][record.clientId] || 0;
        tempRecords[record.opId][record.clientId] += record.count;
    });

    let response = [];
    for (let [opId, clientStats] of Object.entries(tempRecords)) {
        for (let [clientId, count] of Object.entries(clientStats)) {
            response.push({ opId, clientId, count });
        }
    }
    return response;

}.bind(dataStore);

dataStore.queryClientStatGroupbyAppOp = async function ({ clientId, bucketStart, bucketEnd }) {

    let statRecords = this._statRecords;

    let tempRecords = {};
    statRecords.filter((record) => {
        return record.clientId === clientId && record.bucketStart >= bucketStart && record.bucketEnd <= bucketEnd;
    }).forEach(record => {
        tempRecords[record.appId] = tempRecords[record.appId] || {};
        tempRecords[record.appId][record.opId] = tempRecords[record.appId][record.opId] || 0;
        tempRecords[record.appId][record.opId] += record.count;
    });

    let response = [];
    for (let [appId, opStats] of Object.entries(tempRecords)) {
        for (let [opId, count] of Object.entries(opStats)) {
            response.push({ appId, opId, count });
        }
    }
    return response;
}.bind(dataStore);

module.exports.dataStore = dataStore;