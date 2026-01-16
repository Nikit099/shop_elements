const fs = require('fs');
const path = require('path');

module.exports = {
  style: {
    modules: {
      localIdentName: '[hash:base64:5]',
    },
  },
  devServer: {
    port: 8081,
    host: "127.0.0.1",
  },
};
