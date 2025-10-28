const webpack = require('webpack');

module.exports = function override(config) {
  // 添加 fallback 配置
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "process": require.resolve("process/browser.js"),
    "buffer": require.resolve("buffer/"),
    "stream": require.resolve("stream-browserify"),
    "util": require.resolve("util/"),
    "crypto": false,
    "assert": require.resolve("assert/"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "url": require.resolve("url/")
  };
  
  // 添加全局变量
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer']
    })
  ];
  
  // 解决 axios 和其他模块的 ESM 导入问题
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false
    }
  });
  
  return config;
};
