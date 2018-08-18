import webpack from 'webpack';
import webpackMerge from 'webpack-merge';
import appEnv from '../appEnv';
import paths from '../paths';
import serverConfig from './server.config';
import { defaultRules as jsDefaultRules } from './client.config';
import loaders from './loaders';
import { mergeAndReplaceRules } from './utils';

export const defaultRules = {
  jsRule: {
    ...jsDefaultRules.jsRule,
    include: [...jsDefaultRules.jsRule.include, paths.server.sources],
  },
  cssRule: {
    ...jsDefaultRules.cssRule,
    // process css in server side always as ssr
    use: loaders.css({ ssr: true }),
  },
  cssNodeModulesRule: {
    ...jsDefaultRules.cssNodeModulesRule,
    // process css in server side always as ssr
    use: loaders.css({ ssr: true, pattern: '[local]', prodPattern: '[local]' }),
  },
  assetsRule: {
    ...jsDefaultRules.assetsRule,
    use: loaders.assets({ ssr: true }),
  },
};

export default ({ entry, rules, nodeExternalsOptions }) => {
  const moduleRules = mergeAndReplaceRules(defaultRules, rules);

  return webpackMerge(serverConfig({ entry, rules: moduleRules, nodeExternalsOptions }), {
    name: 'universal',
    context: paths.root,

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
      ...(appEnv.ssr ? [] : [new webpack.WatchIgnorePlugin([paths.client.root])]),
    ],
  });
};
