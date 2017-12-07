'use strict';

const request = require('request');

async function verifyIdKey({ statServerConfig, key }) {
    if (!key){
        return Promise.reject(new Error('Invalid ID Key'));
    }

    return new Promise((resolve, reject) => {
        request(statServerConfig['id-key-validation-endpoint-url'], {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                json: true,
                body: { key }
            },
            function (error, response, body) {
                if (error) {
                    return reject(error);
                } else if (response.statusCode !== 200) {
                    return reject(new Error('Invalid response with response code ', response.statusCode));
                } else {
                    let resBody = body;
                    if (typeof resBody === 'string') {
                        try {
                            resBody = JSON.parse(resBody);
                        } catch (e) {
                            return reject(e);
                        }
                    }
                    if (resBody && resBody.result === true) {
                        return resolve(true);
                    } else {
                        return resolve(false);
                    }
                }
            });
    });
}

module.exports.verifyIdKey = verifyIdKey;