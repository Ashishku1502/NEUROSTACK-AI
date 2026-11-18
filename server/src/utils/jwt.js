const jwt = require('jsonwebtoken');
const config = require('../config');

exports.sign = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpires });

exports.verify = (token) => jwt.verify(token, config.jwtSecret);
