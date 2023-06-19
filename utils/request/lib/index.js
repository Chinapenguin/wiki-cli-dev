'use strict';

const axios = require('axios');
const BASE_URL = process.env.WIKI_CLI_BASE_URL
  ? process.env.WIKI_CLI_BASE_URL
  : 'http://localhost:7001';
const request = axios.create({
  // TODO
  baseURL: BASE_URL,
  timeout: 5000,
});
request.interceptors.response.use(
  (response) => {
    if (response.status == 200) {
      return response.data;
    } else {
      return response.data;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);
module.exports = request;
