import webpack from 'webpack';
import webpackMerge from 'webpack-merge';
import reactEnv from '../reactEnv';
import paths from '../paths';
import serverConfig from './server.config';
import { defaultRules as jsDefaultRules } from './client.config';
import loaders from './loaders';

export const defaultRules = {
  jsRule: {
    ...jsDefaultRules.jsRule,
    include: [...jsDefaultRules.jsRule.include, paths.server.sources, paths.root],
  },
  cssRule: {
    ...jsDefaultRules.cssRule,
    use: loaders.css({
      ssr: true,
      minimize: reactEnv.ifDevMode(false, {
        preset: ['default', { discardComments: { removeAll: true } }],
      }),
    }),
  },
  cssNodeModulesRule: {
    ...jsDefaultRules.cssNodeModulesRule,
    use: loaders.css({
      ssr: true,
      pattern: '[local]',
      prodPattern: '[local]',
      minimize: reactEnv.ifDevMode(false, {
        preset: ['default', { discardComments: { removeAll: true } }],
      }),
    }),
  },
  assetsRule: {
    ...jsDefaultRules.assetsRule,
    use: loaders.assets({ ssr: true }),
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

  return webpackMerge(serverConfig({ entry, rules: moduleRules }), {
    resolve: {
      modules: [paths.client.sources],
      alias: {
        shared: paths.shared.sources,
      },
    },

    plugins: [
      // Don't watch on client files when ssr is turned off.
      ...(reactEnv.ssr ? [] : [new webpack.WatchIgnorePlugin([paths.client.root])]),
    ],
  });
};
