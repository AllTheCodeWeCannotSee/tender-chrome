const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "production", // 或 "development" 开发时可使用 development 模式
  entry: {
    content: "./src/content.js",
    background: "./src/background.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js", // 生成 content.js 和 background.js
  },
  module: {
    rules: [
      {
        test: /\.js$/, // 对所有 .js 文件使用 babel-loader
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"], // 转换为兼容版本
          },
        },
      },
    ],
  },
  plugins: [
    // 自动复制 manifest.json 到 dist 目录
    new CopyWebpackPlugin({
      patterns: [
        { from: "manifest.json", to: "." },
        // 如果有其他静态文件也可以在这里添加
      ],
    }),
  ],
};
