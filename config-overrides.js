const { override, addWebpackPlugin, addWebpackResolve } = require('customize-cra');
const webpack = require('webpack');

module.exports = override(
  addWebpackPlugin(
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
    })
  ),
  addWebpackResolve({
    fallback: {
      "process": require.resolve("process/browser.js"),
    },
    extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx']
  })
);