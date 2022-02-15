'use strict';

var AssemblyPoint = {
  name:         String,
  description:  String,
  ordenDia:     String,
  file:         String,
  image:        String,
  assemblyId:   String,
  inFavor:      Number,
  nay:          Number,
  abstinence:   Number,
  isActive:     Boolean,
  usersId: [],
};

module.exports = AssemblyPoint;
