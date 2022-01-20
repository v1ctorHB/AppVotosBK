'use strict';

const { VOTE_TYPE } = require('../enums/vote.enums');

var Vote = {
  type:         VOTE_TYPE,
  userId:       String,
  assemblyPtId: String,
  pointId: String,
};

module.exports = Vote;
