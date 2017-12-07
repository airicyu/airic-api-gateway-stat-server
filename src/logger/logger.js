'use strict';

const loggerHolder = {
    getLogger: null,
    setLogger: null
}

loggerHolder.getLogger = function () {
    return this.logger;
}.bind(loggerHolder);

loggerHolder.setLogger = function (logger) {
    this.logger = logger;
}.bind(loggerHolder);


loggerHolder.setLogger(console);

module.exports = loggerHolder;