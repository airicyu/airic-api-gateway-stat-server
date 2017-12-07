# airic-api-gateway-stat-server

[![npm version](https://img.shields.io/npm/v/airic-api-gateway-stat-server.svg)](https://www.npmjs.com/package/airic-api-gateway-stat-server)
[![node](https://img.shields.io/node/v/airic-api-gateway-stat-server.svg)](https://www.npmjs.com/package/airic-api-gateway-stat-server)
[![Codecov branch](https://img.shields.io/codecov/c/github/airicyu/airic-api-gateway-stat-server/master.svg)](https://codecov.io/gh/airicyu/airic-api-gateway-stat-server)
[![Build](https://travis-ci.org/airicyu/airic-api-gateway-stat-server.svg?branch=master)](https://travis-ci.org/airicyu/airic-api-gateway-stat-server)

[![dependencies Status](https://david-dm.org/airicyu/airic-api-gateway-stat-server/status.svg)](https://david-dm.org/airicyu/airic-api-gateway-stat-server)
[![devDependencies Status](https://david-dm.org/airicyu/airic-api-gateway-stat-server/dev-status.svg)](https://david-dm.org/airicyu/airic-api-gateway-stat-server?type=dev)

## Description

airic-api-gateway-stat-server module is the config server component of airic-api-gateway.

------------------------

## Samples

### Hello world

Starting server:

```javascript
'use strict';
const YAML = require('yamljs');
const statServer = require('airic-api-gateway-stat-server');

const statServerConfigYaml = YAML.load('./stat-server-config.yaml');

statServer.setConfig(statServerConfigYaml)
statServer.run();
```

------------------------

## Stat Server Config YAML

Sample:
```yaml
pull-api-config-interval-second: 60
config-server-base-url: http://localhost:3001
id-key-validation-endpoint-url: http://localhost:3002/keys/id-key/verification
admin-token: d8745e9d03be41ad817a47176ade4dcc
```


------------------------

## REST APIs

### Query App API usage stat. Grouped by Client
POST http://localhost:3005/statQuery/app/b84cdbefe8ab42d38df0aa415030c4a1
Content-type: application/json
id-key: {{appIdKey}}

{
    "bucketStart": 1508560920,
    "bucketEnd": 1600000000,
    "groupBy": "clientId"
}

### Query App API usage stat. Grouped by Operation
POST http://localhost:3005/statQuery/app/b84cdbefe8ab42d38df0aa415030c4a1
Content-type: application/json
id-key: {{workspaceIdKey}}

{
    "bucketStart": 1508560920,
    "bucketEnd": 1600000000,
    "groupBy": "opId"
}

### Query App API usage stat. Grouped by Client and filter by specific Client
POST http://localhost:3005/statQuery/app/b84cdbefe8ab42d38df0aa415030c4a1
Content-type: application/json
id-key: {{workspaceIdKey}}

{
    "clientId": "4364938982b54da1807c599a955cdfcc",
    "bucketStart": 1508560920,
    "bucketEnd": 1600000000,
    "groupBy": "clientId"
}

### Query App API usage stat. Grouped by Operation and filter by specific Client
POST http://localhost:3005/statQuery/app/b84cdbefe8ab42d38df0aa415030c4a1
Content-type: application/json
id-key: {{workspaceIdKey}}

{
    "clientId": "4364938982b54da1807c599a955cdfcc",
    "bucketStart": 1508560920,
    "bucketEnd": 1600000000,
    "groupBy": "opId"
}

### Query Client perspective App API usage stat. Grouped by App.
POST http://localhost:3005/statQuery/client/4364938982b54da1807c599a955cdfcc
Content-type: application/json
id-key: {{workspaceIdKey}}

{
    "bucketStart": 1508560920,
    "bucketEnd": 1600000000
}
