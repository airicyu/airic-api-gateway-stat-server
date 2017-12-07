'use strict';

const YAML = require('yamljs');
const request = require('request');

const configSource = {
    pull: null,
    getAppOpenApiSpec: null
};

configSource.pull = async function (serverConfig) {
    let configUrl = `${serverConfig['config-server-base-url']}/config/export`;
    return new Promise((resolve, reject) => {
        request(configUrl, {
                json: true,
                headers: {
                    'id-key' : serverConfig['admin-token'] || ''
                }
            },
            function (error, response, body) {
                if (error) {
                    reject(error);
                } else if (response.statusCode === 200) {
                    resolve(body);
                } else {
                    resolve(null);
                }
            });
    });
}.bind(configSource);

module.exports.configSource = configSource;