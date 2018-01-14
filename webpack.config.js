'use strict';
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: {
        'user-cookie-provider': './src/user-cookie-provider.js'
    },
    output: {
        path: __dirname + '/dist', // output directory
        filename: "[name].js" // name of the generated bundle
    }
};
