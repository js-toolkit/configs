import webpackMerge from 'webpack-merge';
import webpackNodeExternals from 'webpack-node-externals';
import paths, { dirMap } from '../paths';
import commonConfig from './common.config';
import loaders from './loaders';

export const defaultRules = {
  jsRule: {
    test: /\.jsx?$/,
    include: [paths.server.sources, paths.shared.sources],
    use: loaders.babel(),
  },
};

export default ({ entry, rules }) => {
  // Merge and replace rules
  const moduleRules = webpackMerge.strategy(
    Object.getOwnPropertyNames(defaultRules).reduce(
      (obj, name) => ({ ...obj, [name]: 'replace' }),
      {}
    )
  )(defaultRules, rules);

  return webpackMerge(
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
        modules: [paths.nodeModules.root, paths.server.sources, paths.root],
      },

      // http://jlongster.com/Backend-Apps-with-Webpack--Part-I
      externals: webpackNodeExternals(),

      stats: 'errors-only',
      // stats: {
      //   colors: true,
      //   cached: false, // Add information about cached (not built) modules
      // },

      module: {
        rules: Object.getOwnPropertyNames(moduleRules).map(
          name => (moduleRules[name] ? moduleRules[name] : {})
        ),
      },
    }
  );
};
