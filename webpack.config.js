const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    app: "./canvas/index.ts",
    vendor: ["jquery", "jqueryui", "d3"]
    //    cgx: [ '@cryptographix/sim-core' ],
  },
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: (resourcePath, context) => {
                // publicPath is the relative path of the resource to the context
                // e.g. for ./css/admin/main.css the publicPath will be ../../
                // while for ./css/main.css the publicPath will be ../
                return path.relative(path.dirname(resourcePath), context) + "/";
              }
            }
          },
          {
            loader: "css-loader"
          },
          {
            loader: "resolve-url-loader",
            options: {
              root: path.resolve(__dirname, "public/")
            }
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              sourceMapContents: false,
              includePaths: [
                path.resolve(__dirname, "canvas/core/"),
                path.resolve(__dirname, "public/")
              ]
            }
          }
        ]
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "/static/fonts/"
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Cryptographix Canvas",
      template: "canvas/index.html"
    }),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename:
        "[name]-[contenthash].css" /*".[contenthash].css",
        disable: process.env.NODE_ENV === "development"*/
    }),
    //new webpack.HashedModuleIdsPlugin(),
    new webpack.NamedModulesPlugin()
    /*new webpack.optimize.CommonsChunkPlugin({
       name: 'cgx'
    }),*/
    /*new webpack.optimize.CommonsChunkPlugin({
       name: 'vendor'
    })*/
    /*new webpack.optimize.CommonsChunkPlugin({
       name: 'runtime'
    }),*/
  ],
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "@shared": path.resolve(__dirname, "./shared")
    }
  },
  output: {
    filename: "[name]-[chunkhash].js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/labs"
  },
  devServer: {
    contentBase: "./public/",
    //quiet: true,
    //clientLogLevel: "info",
    headers: { "X-Custom-Header": "yes" }
  }
};
