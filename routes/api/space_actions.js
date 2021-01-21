"use strict";
var config = require('config');
const db = require('../../models/db');
const actions = require('../../models/actions');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const uuidv4 = require('uuid/v4');

var redis = require('../../helpers/redis');
var mailer = require('../../helpers/mailer');
var uploader = require('../../helpers/uploader');
var space_render = require('../../helpers/space-render');
var phantom = require('../../helpers/phantom');

var async = require('async');
var fs = require('fs');
var _ = require("underscore");
var archiver = require('archiver');
var request = require('request');
var url = require("url");
var path = require("path");
var crypto = require('crypto');
var glob = require('glob');

var express = require('express');
var router = express.Router({mergeParams: true});

// JSON MAPPINGS

var userMapping = {
  _id: 1,
  nickname: 1,
  email: 1,
  avatar_thumb_uri: 1
};

var spaceMapping = {
  _id: 1,
  name: 1,
  thumbnail_url: 1
};

var roleMapping = {
  "none": 0,
  "viewer": 1,
  "editor": 2,
  "admin": 3
}

// ACTIONS

router.get('/', function(req, res, next) {
  res.status(200).json({
    now: new Date().getTime(),
  });
});

router.get('/:lastTimestamp', function(req, res, next) {
  console.debug('GET ACTIONNNNNNNNNNNNNNNNNNNNNN for space ' + req.space._id)
  console.debug(req.params.lastTimestamp)
  loop(req, res, 0)
});

function loop(req, res, i) {
    // setTimeout(() => {
    //   res.status(200).json({
    //     actions: actions.spaceActions[req.space._id],
    //     allActions: actions.spaceActions,
    //   });
    // }, 5000)
    // return
  const recentActions = getRecentActions(req.space._id, req.params.lastTimestamp)
  if (recentActions.length > 0 || i >= 10) {
    res.status(200).json({
      actions: recentActions,
    });
  } else {
    setTimeout(() => {
      loop(req, res, i + 1)
    }, 1000)
  }
}

function getRecentActions(spaceId, minTs) {
  const recent = []
  if (spaceId in actions.spaceActions) {
    let i = actions.spaceActions[spaceId].length - 1
    while (i >= 0) {
      const ts = new Date(actions.spaceActions[spaceId][i].object.updated_at).getTime()
      if (ts > minTs) {
        recent.unshift(actions.spaceActions[spaceId][i])
      } else {
        break;
      }
      i--
    }
  }
  return recent
}

module.exports = router;
