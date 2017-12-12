'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const loggerHolder = require('./logger/logger');
const dataStoreHolder = require('./data-store/data-store').dataStoreHolder;
const apiConfigHolder = require('./config/api-config').apiConfigHolder;
const memoryDataStore = require('./data-store/memory-data-store').dataStore;
const sqliteDataStore = require('./data-store/sqlite-data-store').dataStore;
const mysqlDataStore = require('./data-store/mysql-data-store').dataStore;
const keyService = require('./services/key-service');
const jwt = require('jsonwebtoken');

const statServer = {
    _app: null,
    _config: null,
    setConfig: null,
    setDataStore: null,
    inflatExpressApp: null,
    run: null,
    implementations: {
        dataStore: {
            memoryDataStore,
            mysqlDataStore,
            sqliteDataStore
        }
    }
}

statServer.setConfig = function (config) {
    this._config = config;
}.bind(statServer);

statServer.setDataStore = function (dataStore) {
    dataStoreHolder.setDataStore(dataStore);
}

statServer.inflatExpressApp = function (app) {
    this._app = app || express();
    app = this._app;

    app.use(bodyParser.json({ limit: '100mb' }))

    const orPermisionFilter = (...orPermissionCheckers) => {
        return async(req, res, next) => {
            let result = false;
            for (let orPermissionChecker of orPermissionCheckers) {
                if (await orPermissionChecker(req)) {
                    result = true;
                    break;
                }
            }

            return Promise.resolve(result ? next() : res.send(401));
        }
    }

    const adminTokenFilter = (req) => {
        let idKey = req.header('id-key');
        return (idKey === statServer._config['admin-token']);
    }

    const workspaceIdTokenFilter = (getValidateWorkspaceIdFunc) => {
        return async(req) => {
            let validateWorkspaceId = getValidateWorkspaceIdFunc ? await getValidateWorkspaceIdFunc(req) : null;
            try {
                let idKey = req.header('id-key');

                let verifyIdKeyResult = await keyService.verifyIdKey({ statServerConfig: statServer._config, key: idKey });
                if (verifyIdKeyResult) {
                    let keyDecoded = jwt.decode(idKey);
                    if (keyDecoded != null && keyDecoded['token-type'] === 'identity' && keyDecoded['sub-type'] === 'workspace' &&
                        (validateWorkspaceId === null || keyDecoded['sub'] === validateWorkspaceId)) {
                        let subject = keyDecoded['sub'];
                        return Promise.resolve(subject);
                    }

                }

            } catch (e) {
                loggerHolder.getLogger().error(e);
            }
            return Promise.resolve(false);
        };
    }

    const appIdTokenFilter = (getValidateAppIdFunc) => {
        return async(req) => {
            let validateAppId = getValidateAppIdFunc ? await getValidateAppIdFunc(req) : null;
            try {
                let idKey = req.header('id-key');
                
                let verifyIdKeyResult = await keyService.verifyIdKey({ statServerConfig: statServer._config, key: idKey });
                if (verifyIdKeyResult) {
                    let keyDecoded = jwt.decode(idKey);
                    if (keyDecoded != null && keyDecoded['token-type'] === 'identity' && keyDecoded['sub-type'] === 'app' &&
                        (validateAppId === null || keyDecoded['sub'] === validateAppId)) {
                        let subject = keyDecoded['sub'];
                        return Promise.resolve(subject);
                    }

                }

            } catch (e) {
                loggerHolder.getLogger().error(e);
            }
            return Promise.resolve(false);
        };
    }

    const clientIdTokenFilter = (getValidateClientIdFunc) => {
        return async(req) => {
            let validateClientId = getValidateClientIdFunc ? await getValidateClientIdFunc(req) : null;
            try {
                let idKey = req.header('id-key');
                
                let verifyIdKeyResult = await keyService.verifyIdKey({ statServerConfig: statServer._config, key: idKey });
                if (verifyIdKeyResult) {
                    let keyDecoded = jwt.decode(idKey);
                    if (keyDecoded != null && keyDecoded['token-type'] === 'identity' && keyDecoded['sub-type'] === 'app' &&
                        (validateClientId === null || keyDecoded['sub'] === validateClientId)) {
                        let subject = keyDecoded['sub'];
                        return Promise.resolve(subject);
                    }

                }

            } catch (e) {
                loggerHolder.getLogger().error(e);
            }
            return Promise.resolve(false);
        };
    }

    app.post('/stat', orPermisionFilter(
        adminTokenFilter,
        workspaceIdTokenFilter(),
        appIdTokenFilter()
    ), (req, res) => {
        //todo validate stat record is workspace/app conform
        let event = req.body;
        res.send('');
        dataStoreHolder.getDataStore().onStatEvent(event).then();
    });

    app.post('/statQuery/app/:appId', orPermisionFilter(
        adminTokenFilter,
        workspaceIdTokenFilter(async (req) => {
            let config = apiConfigHolder.get();
            if (config.apps[req.params.appId]){
                return Promise.resolve(config.apps[req.params.appId].workspaceId);
            } else {
                return Promise.resolve(undefined);
            }
        }),
        appIdTokenFilter(async (req) => Promise.resolve(req.params.appId))
    ), (req, res) => {
        let appId = req.params.appId;
        let clientId = req.body.clientId;
        let bucketStart = req.body.bucketStart;
        let bucketEnd = req.body.bucketEnd;
        let groupBy = req.body.groupBy;
        if (groupBy !== 'clientId' && groupBy !== 'opId') {
            groupBy = null;
        }

        dataStoreHolder.getDataStore().queryAppStatGroupbyOpClient({
            appId: appId,
            bucketStart: bucketStart,
            bucketEnd: bucketEnd
        }).then((results) => {

            let returnResult = [];

            if (results) {
                if (clientId) {
                    results = results.filter(_ => {
                        return _['clientId'] === clientId;
                    });
                }

                let resultMap = {}
                if (groupBy === 'clientId') {
                    for (let result of results) {
                        resultMap[result['clientId']] = resultMap[result['clientId']] || {};
                        resultMap[result['clientId']][result['opId']] = result['count'];
                    }
                } else if (groupBy === 'opId') {
                    for (let result of results) {
                        resultMap[result['opId']] = resultMap[result['opId']] || {};
                        resultMap[result['opId']][result['clientId']] = result['count'];
                    }
                }

                let resultList = [];
                if (groupBy === 'clientId') {
                    for (let [clientId, value] of Object.entries(resultMap)) {
                        let record = {
                            clientId,
                            stat: [],
                        };
                        for (let [opId, count] of Object.entries(value)) {
                            record.stat.push({ opId, count });
                        }
                        resultList.push(record);
                    }
                } else if (groupBy === 'opId') {
                    for (let [opId, value] of Object.entries(resultMap)) {
                        let record = {
                            opId,
                            stat: [],
                        };
                        for (let [clientId, count] of Object.entries(value)) {
                            record.stat.push({ clientId, count });
                        }
                        resultList.push(record);
                    }
                }
                returnResult = resultList;
            }
            res.send(returnResult)
        });

    });

    app.post('/statQuery/client/:clientId', orPermisionFilter(
        adminTokenFilter,
        workspaceIdTokenFilter(async (req) => {
            let config = apiConfigHolder.get();
            if (config.clients[req.params.clientId]){
                return Promise.resolve(config.clients[req.params.clientId].workspaceId);
            } else {
                return Promise.resolve(undefined);
            }
        }),
        clientIdTokenFilter(async (req) => Promise.resolve(req.params.clientId))
    ), (req, res) => {
        let clientId = req.params.clientId;
        let appId = req.body.appId;
        let bucketStart = req.body.bucketStart;
        let bucketEnd = req.body.bucketEnd;

        dataStoreHolder.getDataStore().queryClientStatGroupbyAppOp({
            clientId: clientId,
            bucketStart: bucketStart,
            bucketEnd: bucketEnd
        }).then((results) => {

            let returnResult = [];

            if (results) {
                if (appId) {
                    results = results.filter(_ => {
                        return _['appId'] === appId;
                    });
                }

                let resultMap = {}
                for (let result of results) {
                    resultMap[result['appId']] = resultMap[result['appId']] || {};
                    resultMap[result['appId']][result['opId']] = result['count'];
                }

                let resultList = [];
                for (let [appId, value] of Object.entries(resultMap)) {
                    let record = {
                        appId,
                        stat: [],
                    };
                    for (let [opId, count] of Object.entries(value)) {
                        record.stat.push({ opId, count });
                    }
                    resultList.push(record);
                }
                returnResult = resultList;
            }
            res.send(returnResult)
        });

    });

}.bind(statServer);

statServer.run = async function (port = 3005) {
    let self = this;
    if (!self._app) {
        self.inflatExpressApp();
    }

    await apiConfigHolder.pullConfig(statServer._config);
    self.pullConfigInterval = setInterval(apiConfigHolder.pullConfig, statServer._config['pull-api-config-interval-second'] * 1000, statServer._config);

    return new Promise((resolve) => {
        self._app.listen(port, function () {
            clearInterval(self.pullConfigInterval);
            console.log(`API stat server started with port ${port}`);
            resolve();
        });
    });
}

module.exports = statServer;