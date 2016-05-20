var config = {
  context: __dirname + "/app",
  entry: "./main.js",

  output: {
    filename: "bundle.js",
    path: __dirname + "/dist",
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['react', 'es2015']
        }
      },
      { test: /\.css$/, loader: "style!css" },
    ],
  },
  devtool: 'source-map',
  devServer: {
    historyApiFallback: true,
    contentBase: './dist/',
    port: 8113
  }

};
module.exports = config;
