'use strict';

const { USER_ROLES, USER_STATUS } = require('../enums/user.enums');
const { COUNTRIES }               = require('../enums/country.enums');

var User = {
  name:     String,
  lastname: String,
  email:    String,
  password: String,
  phoneNum: String,
  image:    String,
  canVote:  Boolean,
  country:  COUNTRIES,
  role:     USER_ROLES,
  status:   USER_STATUS,
};

module.exports = User;