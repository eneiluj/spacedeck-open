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
      this.cursorSubscriber = redisMock.getConnection().subscribe(['updates'], function (err, count) {
        console.log("[redis-mock] websockets subscribed to " + count + " topics." );
      });
    } else {
      this.cursorSubscriber = new RedisConnection(6379, process.env.REDIS_PORT_6379_TCP_ADDR || config.get("redis_host"));
      this.cursorSubscriber.subscribe(['updates'], function (err, count) {
        console.log("[redis] websockets subscribed to " + count + " topics." );
      });
    }

    this.cursorSubscriber.on('message', function (channel, rawMessage) {
      const msg = JSON.parse(rawMessage);
      const spaceId = msg.object.space_id;
      console.debug('!!!!!!!!!!!!!!! subscriber message ('+msg.action+') channel:' + channel + ' for space ' + spaceId)
      if (!(spaceId in actions.spaceActions)) {
        actions.spaceActions[spaceId] = []
      }
      if (msg.action === 'delete' || msg.action === 'create') {
        msg.object.updated_at = new Date()
      } else if (msg.action === 'update') {
        // console.debug(msg.object)
        console.debug(msg.object.updated_at)
      }
      actions.spaceActions[spaceId].push(msg)

    }.bind(this));
  },

};
