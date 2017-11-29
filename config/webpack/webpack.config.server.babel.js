import webpackMerge from 'webpack-merge';
import webpackNodeExternals from 'webpack-node-externals';
import fs from 'fs';
import paths from '../paths';
import commonConfig from './webpack.config.common.babel';
import loaders from './loaders';

export default entry =>
  webpackMerge(
    commonConfig({
      outputPath: paths.server.output.path,
      outputPublicPath: paths.server.output.publicPath,
    }),
    {
      name: 'server',
      target: 'node',

      context: paths.server.root,

      entry: entry,

      output: {
        filename: '[name].js', // Только так работает HMR с webpack
      },

      resolve: {
        modules: [paths.nodeModules.path, paths.server.sources, paths.context],
      },

      // http://jlongster.com/Backend-Apps-with-Webpack--Part-I
      externals: webpackNodeExternals(),

      stats: 'errors-only',
      // stats: {
      //   colors: true,
      //   cached: false, // Add information about cached (not built) modules
      // },

      module: {
        rules: [
          {
            test: /\.jsx?$/,
            include: [paths.server.sources, paths.shared.root],
            use: loaders.babel(),
          },
        ],
      },
    }
  );
