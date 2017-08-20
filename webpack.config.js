'use strict';
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: './src/xdomain_cookie.js', // bundle's entry point
  plugins: [
    new UglifyJSPlugin()
  ],
  output: {
    path: __dirname + '/dist', // output directory
    filename: 'xdomain_cookie.js' // name of the generated bundle
  }
};