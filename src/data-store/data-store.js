'use strict';

const defaultDataStore = require('./memory-data-store').dataStore;


const dataStoreHolder = {
    _dataStore: defaultDataStore,
    setDataStore: null,
    getDataStore: null
}

dataStoreHolder.setDataStore = function (dataStore) {
    this._dataStore = dataStore;
}.bind(dataStoreHolder);

dataStoreHolder.getDataStore = function () {
    return this._dataStore;
}.bind(dataStoreHolder);

module.exports.dataStoreHolder = dataStoreHolder;