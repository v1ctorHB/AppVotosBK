'use strict';

var jwt     = require('jwt-simple');
var moment  = require('moment');
var secret  = 'parlamento-centroamericano-j$≠029:_≠2/$≠^1#l9k`';
var secret1 = 'parlamento-centroamericano-user-j$≠029:_≠2/$≠^1#l9k`';

exports.createToken = id => {
    var payload = {
        sub: id,
        iat: moment().unix(),
        exp: moment().add(2, 'days').unix(),
    };

    return jwt.encode(payload, secret);
}

exports.createUserToken = id => {
    var payload = {
        sub: id,
        iat: moment().unix(),
        exp: moment().add(6, 'hours').unix(),
    }

    return jwt.encode(payload, secret1);
}