const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const DotenvWebpack = require("dotenv-webpack");

module.exports = (_, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: path.resolve(__dirname, "src", "index.tsx"),

    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProduction ? "static/js/[name].[contenthash].js" : "static/js/[name].js",
      chunkFilename: isProduction
        ? "static/js/[name].[contenthash].chunk.js"
        : "static/js/[name].chunk.js",
      publicPath: "/",
      clean: true,
    },

    mode: isProduction ? "production" : "development",

    devtool: isProduction ? "hidden-source-map" : "eval-cheap-module-source-map",

    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js"],
    },

    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                ["@babel/preset-env", { targets: "defaults" }],
                ["@babel/preset-react", { runtime: "automatic" }],
                "@babel/preset-typescript",
              ],
            },
          },
        },
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            "css-loader",
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg|ico|webp)$/i,
          type: "asset/resource",
          generator: {
            filename: "static/media/[name].[hash][ext]",
          },
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "public", "index.html"),
      }),

      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "public"),
            to: path.resolve(__dirname, "dist"),
            globOptions: {
              ignore: ["**/index.html"],
            },
            noErrorOnMissing: true,
          },
        ],
      }),

      ...(isProduction
        ? [

          new MiniCssExtractPlugin({
            filename: isProduction
              ? "static/css/[name].[contenthash].css"
              : "static/css/[name].css",
          }),
        ]
        : []),

      new ForkTsCheckerWebpackPlugin({
        async: !isProduction,
      }),

      new DotenvWebpack({
        systemvars: true,
      }),
    ],

    optimization: {
      runtimeChunk: "single",
      splitChunks: {
        chunks: "all",
        maxInitialRequests: 30,
        maxAsyncRequests: 30,
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: "react",
            priority: 40,
            enforce: true,
          },
          router: {
            test: /[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/,
            name: "router",
            priority: 30,
          },
          redux: {
            test: /[\\/]node_modules[\\/](@reduxjs|react-redux|redux)[\\/]/,
            name: "redux",
            priority: 25,
          },
          markdown: {
            test: /[\\/]node_modules[\\/](react-markdown|remark-gfm|unified|micromark|mdast-util-|hast-util-|unist-util-|vfile)[\\/]/,
            name: "markdown",
            priority: 20,
            chunks: "async",
          },
        },
      },
    },

    performance: {
      maxEntrypointSize: 350 * 1024,
      maxAssetSize: 250 * 1024,
    },

    devServer: {
      port: 3000,
      historyApiFallback: true,
      hot: true,
      open: true,
      static: {
        directory: path.resolve(__dirname, "public"),
      },
    },
  };
};