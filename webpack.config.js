module.exports = {
  mode: 'development',
  entry: './src/main.ts',
  devServer: {
    contentBase: './dist',
  },
  module: {
    rules: [
      {
        test: /\.glsl$/,
        use: 'raw-loader'
      },
      {
        test: /\.ts$/,
        use: 'ts-loader',
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.glsl']
  },
};