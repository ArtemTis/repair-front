const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const DotenvWebpack = require("dotenv-webpack");
const { ModuleFederationPlugin } = require("webpack").container;
const shared = require("./webpack.shared");

const adminRemoteUrl =
  process.env.ADMIN_REMOTE_URL || "http://localhost:3001";
const adminRemoteEntry = `${adminRemoteUrl.replace(/\/$/, "")}/remoteEntry.js`;

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
      uniqueName: "host",
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
      new ModuleFederationPlugin({
        name: "host",
        remotes: {
          admin: `promise new Promise((resolve, reject) => {
            const remoteUrl = "${adminRemoteEntry}";
            const timeoutMs = 30000;

            const resolveContainer = () => {
              const container = window.admin;
              if (!container || typeof container.get !== "function") {
                return false;
              }
              resolve(container);
              return true;
            };

            if (resolveContainer()) {
              return;
            }

            const timeoutId = setTimeout(() => {
              clearInterval(pollId);
              reject(new Error("Admin remote timeout: " + remoteUrl));
            }, timeoutMs);

            const pollId = setInterval(() => {
              if (resolveContainer()) {
                clearTimeout(timeoutId);
                clearInterval(pollId);
              }
            }, 50);

            const script = document.createElement("script");
            script.src = remoteUrl;
            script.async = true;
            script.onerror = () => {
              clearTimeout(timeoutId);
              clearInterval(pollId);
              reject(new Error("Failed to load admin remote: " + remoteUrl));
            };
            document.head.appendChild(script);
          })`,
        },
        shared,
      }),

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
      splitChunks: {
        chunks: "all",
        maxInitialRequests: 30,
        maxAsyncRequests: 30,
        cacheGroups: {
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
      host: "0.0.0.0",
      historyApiFallback: true,
      hot: true,
      open: true,
      static: {
        directory: path.resolve(__dirname, "public"),
      },
    },
  };
};
