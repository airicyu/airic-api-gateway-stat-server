'use strict';

const loggerHolder = require('./../logger/logger');
const configSource = require('./api-config-source-util').configSource;

const apiConfigHolder = {
    configSource: configSource,
    _lastConfigUpdateTime: null,
    config: {
        apps: {},
        clients: {},
        openApiSpecs:{}
    },
    get: null,
    pullConfig: null
}

apiConfigHolder.get = function () {
    return this.config;
}.bind(apiConfigHolder);



apiConfigHolder.pullConfig = async function (gatewayConfig) {
    loggerHolder.getLogger().log(new Date().toISOString(), 'API Gateway Stat Server pulling API config');

    let pullTime = Date.now();

    let newConfig;
    try {
        newConfig = await this.configSource.pull(gatewayConfig);
    } catch (e) {
        loggerHolder.getLogger().error(e);
    }
    
    if (newConfig){
        let restructuredConfig = {
            workspaces: {},
            apps: {},
            clients: {}
        }

        for (let [workspaceId, workspace] of Object.entries(newConfig.workspaces)){
            restructuredConfig.workspaces[workspaceId] = workspace;
            for (let [appId, app] of Object.entries(workspace.apps)){
                restructuredConfig.apps[appId] = app;
            }
            for (let [clientId, client] of Object.entries(workspace.clients)){
                restructuredConfig.clients[clientId] = client;
            }
        }
        this.config = restructuredConfig;
        loggerHolder.getLogger().log(new Date().toISOString(), 'API Gateway Stat Server pulled API config');
        return Promise.resolve();
    } else {
        return Promise.reject();
    }

    
}.bind(apiConfigHolder);

module.exports.apiConfigHolder = apiConfigHolder;