USE `gateway_stat`;
SELECT * FROM `stat_event`;
SELECT * FROM `stat_record`;

SELECT * FROM `stat_record` where `appId`='b84cdbefe8ab42d38df0aa415030c4a1';

SELECT `opId`, `clientId`, SUM(`count`) AS `count` FROM `stat_record` WHERE `appId` = 'b84cdbefe8ab42d38df0aa415030c4a1' AND `bucketStart` >= 1508560920 AND `bucketEnd` <= 1600000000 GROUP BY `opId`, `clientId`;
SELECT `appId`, `opId`, SUM(`count`) AS `count` FROM `stat_record` WHERE `clientId` = '4364938982b54da1807c599a955cdfcc' AND `bucketStart` >= 1508560920 AND `bucketEnd` <= 1600000000 GROUP BY `appId`, `opId`;