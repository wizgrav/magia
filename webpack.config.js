'use strict';

const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: 'production',
    entry: {
        'main': './src/index.js'
    },
    devtool: 'source-map',
    target: 'web',
   
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "assets", to: "assets"},
                "index.html",
                "favicon.ico",
                "promo.jpg"
            ],
            options: {
              concurrency: 100,
            },
          })
       
        
    ],
    output: {
        path: __dirname + '/build',
        filename: '[name].js'
    },
    performance: {
        maxAssetSize: 20000000,
        maxEntrypointSize: 40000000,
      }
     
    
    
};