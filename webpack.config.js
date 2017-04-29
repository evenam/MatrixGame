module.exports = {
   entry: './main.js',
   output: {
      path: './dist',
      filename: 'index.js',
      pathinfo: true,
      sourceMapFilename: '[file].map'
   },
   devServer: {
      inline: true,
      port: 8080
   },
   module: {
      loaders: [
         {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel',
            query: {
               presets: ['es2015', 'react']
            }
         }
      ]
   }
}

