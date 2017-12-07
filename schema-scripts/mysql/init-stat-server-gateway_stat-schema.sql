DROP SCHEMA `gateway_stat`;
CREATE SCHEMA `gateway_stat`;
USE `gateway_stat`;

DROP TABLE IF EXISTS `stat_event`;
CREATE TABLE `stat_event` (
    `statRecordEventId` VARCHAR(255) NOT NULL,
    `gatewayNodeId` VARCHAR(255) NOT NULL,
    `eventTime` bigint(13) unsigned NOT NULL,
    `recordStart` bigint(13) unsigned NOT NULL,
    `recordEnd` bigint(13) unsigned NOT NULL,
    PRIMARY KEY (`statRecordEventId`)
);

DROP TABLE IF EXISTS `stat_record`;
CREATE TABLE `stat_record` (
    `id` int NOT NULL AUTO_INCREMENT,
    `statRecordEventId` VARCHAR(255) NOT NULL,
    `bucketType` VARCHAR(10) NOT NULL DEFAULT '',
    `bucketStart` bigint(13) unsigned NOT NULL,
    `bucketEnd` bigint(13) unsigned NOT NULL,
    `bucketIndex` bigint(13) unsigned NOT NULL,
    `appId` VARCHAR(36) NOT NULL,
    `opId` VARCHAR(50) NOT NULL,
    `clientId` VARCHAR(36) NOT NULL,
    `count` int unsigned NOT NULL DEFAULT '0',
    PRIMARY KEY (`id`),
    FOREIGN KEY (`statRecordEventId`) REFERENCES `stat_event`(`statRecordEventId`),
    INDEX `stat_record_aggregate_app_stat_index` (`appId`, `clientId`),
    INDEX `stat_record_aggregate_client_stat_index` (`clientId`, `appId`, `opId`)
);