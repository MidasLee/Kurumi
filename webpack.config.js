const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'kurumi-chat.js',
    library: {
      name: 'KurumiChat',
      type: 'umd'
    },
    libraryExport: 'default',
    globalObject: 'this'
  },
  resolve: {
    alias: {
      '@avatars': path.resolve(__dirname, 'src/images/avatars'),
      'jquery': path.resolve(__dirname, 'src/libs/jquery-3.7.1.min.js'),
      'marked': path.resolve(__dirname, 'src/libs/marked-0.3.19.min.js'),
      'layer': path.resolve(__dirname, 'src/libs/layer/layer.js'),
      'layer-theme': path.resolve(__dirname, 'src/libs/layer/theme')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|libs\/html-docx\.js)/, // 排除html-docx.js
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      // CSS 内联（通过 style-loader 注入到 DOM）
      {
        test: /\.css$/,
        oneOf: [
          // 处理 `*.css?inline`，返回纯文本（不注入 DOM）
          {
            resourceQuery: /inline/,
            use: [
              {
                loader: 'css-loader',
                options: {
                  esModule: false,
                  exportType: 'string' // 返回 CSS 字符串
                }
              }
            ]
          },
          // 默认处理方式（注入 DOM）
          {
            use: [
              'style-loader',
              {
                loader: 'css-loader',
                options: {
                  esModule: false
                }
              }
            ]
          }
        ]
      },
      // 图片转为 Base64 内联
      {
        test: /\.(png|jpg|gif|swf)$/,
        type: 'asset/inline' // 转为 Base64 嵌入 JS
      },
      {
        test: /\.(eot|woff2?|ttf|svg)$/,
        type: 'asset/inline'
      },
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      layer: 'layer',
      marked: 'marked'
    })
  ]
};