const path = require('path');

module.exports = {
  mode: 'development',
  // mode: 'production',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'webpack.umd.js'
  }
}