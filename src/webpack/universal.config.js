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

export default ({ entry, rules, nodeExternalsOptions }) => {
  // Merge and replace rules
  const moduleRules = webpackMerge.strategy(
    Object.getOwnPropertyNames(defaultRules).reduce(
      (obj, name) => ({ ...obj, [name]: 'replace' }),
      {}
    )
  )(defaultRules, rules);

  return webpackMerge(serverConfig({ entry, rules: moduleRules, nodeExternalsOptions }), {
    resolve: {
      modules: [paths.client.sources],
      alias: {
        server: paths.server.sources,
        shared: paths.shared.sources,
        client: paths.client.sources,
      },
    },

    plugins: [
      // Don't watch on client files when ssr is turned off because client by self make hot update
      // and server not needs in updated files because server not render react components.
      ...(reactEnv.ssr ? [] : [new webpack.WatchIgnorePlugin([paths.client.root])]),
    ],
  });
};
