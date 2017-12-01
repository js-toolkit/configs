import webpackMerge from 'webpack-merge';
import webpackNodeExternals from 'webpack-node-externals';
import paths, { dirMap } from '../paths';
import commonConfig from './common.config';
import loaders from './loaders';

export default entry =>
  webpackMerge(
    commonConfig({
      outputPath: paths.server.output.path,
      outputPublicPath: paths.server.output.publicPath,
    }),
    {
      name: dirMap.serverDir,
      target: 'node',

      context: paths.server.root,

      entry,

      output: {
        filename: '[name].js', // Только так работает HMR с webpack
      },

      resolve: {
        modules: [paths.nodeModules.path, paths.server.sources, paths.root],
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
