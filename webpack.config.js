'use strict';
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: {
        'xdomain_cookie': './src/xdomain_cookie.js',
        'xdomain_cookie.min': './src/xdomain_cookie.js',
        'user-cookie-provider': ['./src/user-cookie-provider.js',  './src/xdomain_cookie.js']
    },
    plugins: [
        new UglifyJSPlugin({
            include: /\.min\.js$/,
            minimize: true
        })
    ],
    output: {
        path: __dirname + '/dist', // output directory
        filename: "[name].js" // name of the generated bundle
    }
};
