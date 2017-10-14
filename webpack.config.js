const path = require( 'path' );
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: {
    app: './canvas/index.ts'
  },
  devtool: 'inline-source-map',
  module: {
    rules: [ {
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/
    },
/*    {
      test: /\.scss$/,
      use: [{
          loader: "style-loader" // creates style nodes from JS strings
      },
      {
          loader: "css-loader" // translates CSS into CommonJS
      },
      {
          loader: "sass-loader" // compiles Sass to CSS
      }]
    },*/
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
        filename: "[name].css" /*".[contenthash].css",
        disable: process.env.NODE_ENV === "development"*/
    })
  ],
  resolve: {
    extensions: [ ".ts", ".js" ]
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve( __dirname, 'dist' )
  }
};
