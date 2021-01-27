'use strict';

const actions = require('../models/actions');
const config = require('config');

//const RedisConnection = require('ioredis');
const async = require('async');
const _ = require("underscore");
const crypto = require('crypto');

const redisMock = require("./redis.js");

module.exports = {
  setupSubscription: function() {
    if (config.get("redis_mock")) {
      this.cursorSubscriber = redisMock.getConnection().subscribe(['cursors', 'updates'], function (err, count) {
        console.log("[redis-mock] async refresh subscribed to " + count + " topics." );
      });
    } else {
      this.cursorSubscriber = new RedisConnection(6379, process.env.REDIS_PORT_6379_TCP_ADDR || config.get("redis_host"));
      this.cursorSubscriber.subscribe(['cursors', 'updates'], function (err, count) {
        console.log("[redis] async refresh subscribed to " + count + " topics." );
      });
    }

    this.cursorSubscriber.on('message', function (channel, rawMessage) {
      const msg = JSON.parse(rawMessage);
      const spaceId = msg.object.space_id;
      console.debug('!!!!!!!!!!!!!!! subscriber message ('+msg.action+') channel:' + channel + ' for space ' + spaceId)
      if (!(spaceId in actions.spaceActions)) {
        actions.spaceActions[spaceId] = []
      }
      if (msg.action === 'delete' || msg.action === 'create' || msg.action === 'update-self' || msg.action === 'cursor') {
        msg.object.updated_at = new Date()
      }
      actions.spaceActions[spaceId].push(msg)
      // avoid having too many actions stored: remove 500 elements when we reach a size of 1000
      if (actions.spaceActions[spaceId].length > 1000) {
        actions.spaceActions[spaceId].splice(0, 500)
      }

    }.bind(this));
  },

};
