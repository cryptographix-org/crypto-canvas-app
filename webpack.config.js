const path = require( 'path' );
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: {
    app: './canvas/index.ts',
    vendor: [
      'jquery','jqueryui','d3'
    ],
//    cgx: [ '@cryptographix/sim-core' ],
  },
  devtool: 'inline-source-map',
  module: {
    rules: [ {
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/
    },
    {
      test: /\.scss$/,
      use: ExtractTextPlugin.extract({
        // use style-loader in development
        fallback: "style-loader",
        use: [{
          loader: "css-loader"
        }, {
          loader: "sass-loader",
          options: {
            includePaths: [path.resolve(__dirname, 'canvas/core/')]
          }
        }],
      })
    } ]
  },
  plugins: [
    new HtmlWebpackPlugin( {
      title: 'Cryptographix Canvas',
      template: 'canvas/index.html'
    } ),
    new CleanWebpackPlugin(['dist']),
    new ExtractTextPlugin({
        filename: "[name]-[contenthash].css" /*".[contenthash].css",
        disable: process.env.NODE_ENV === "development"*/
    }),
    //new webpack.HashedModuleIdsPlugin(),
    new webpack.NamedModulesPlugin(),
    /*new webpack.optimize.CommonsChunkPlugin({
       name: 'cgx'
    }),*/
    new webpack.optimize.CommonsChunkPlugin({
       name: 'vendor'
    }),
    /*new webpack.optimize.CommonsChunkPlugin({
       name: 'runtime'
    }),*/
  ],
  resolve: {
    extensions: [ ".ts", ".js" ],
    alias: {
      "@shared": path.resolve(__dirname, "./shared")
    },
  },
  output: {
    filename: '[name]-[chunkhash].js',
    path: path.resolve( __dirname, 'dist' ),
    publicPath: "/"
  },
  devServer: {
    contentBase: "./public/",
    //quiet: true,
    //clientLogLevel: "info",
    headers: { "X-Custom-Header": "yes" }
  }
};
