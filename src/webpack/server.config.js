import webpackMerge from 'webpack-merge';
import webpackNodeExternals from 'webpack-node-externals';
import paths, { dirMap } from '../paths';
import commonConfig from './common.config';
import { defaultRules as jsDefaultRules } from './client.config';

export const defaultRules = {
  jsRule: {
    ...jsDefaultRules.jsRule,
    include: [paths.server.sources, paths.shared.sources],
  },
};

export default ({ entry, rules, nodeExternalsOptions }) => {
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
      outputPublicPath: dirMap.server.output.publicPath,
    }),
    {
      name: dirMap.server.root,
      target: 'node',

      context: paths.server.sources,

      entry,

      output: {
        filename: '[name].js', // Только так работает HMR с webpack
      },

      resolve: {
        modules: [paths.server.sources],
      },

      // http://jlongster.com/Backend-Apps-with-Webpack--Part-I
      externals: webpackNodeExternals(nodeExternalsOptions),

      stats: 'errors-only',
      // stats: {
      //   colors: true,
      //   cached: false, // Add information about cached (not built) modules
      // },

      module: {
        rules: Object.getOwnPropertyNames(moduleRules).map(name => moduleRules[name] || {}),
      },
    }
  );
};
