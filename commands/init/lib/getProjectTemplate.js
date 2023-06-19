'use strict';
const request = require('@wiki-cli-dev/request');
module.exports = function () {
  return request({
    url: '/project',
  });
};
