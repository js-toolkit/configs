import webpack from 'webpack';
import webpackMerge from 'webpack-merge';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';
import reactEnv from '../reactEnv';
import paths from '../paths';
import serverConfig from './server.config';
import loaders from './loaders';

export const defaultRules = {
  jsRule: {
    test: /\.jsx?$/,
    include: [paths.server.sources, paths.client.sources, paths.shared.sources],
    use: loaders.babel(),
  },
  cssRule: {
    test: /\.css$/,
    include: [paths.client.sources],
    use: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: loaders.css({
        ssr: true,
        minimize: reactEnv.ifDevMode(false, {
          preset: ['default', { discardComments: { removeAll: true } }],
        }),
      }),
    }),
  },
  cssNodeModulesRule: {
    test: /\.css$/,
    include: [paths.nodeModules.root],
    use: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: loaders.css({
        ssr: true,
        pattern: '[local]',
        prodPattern: '[local]',
        minimize: reactEnv.ifDevMode(false, {
          preset: ['default', { discardComments: { removeAll: true } }],
        }),
      }),
    }),
  },
  assetsRule: {
    test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|otf)$/,
    include: [paths.client.assets],
    use: loaders.assets({ ssr: true }),
  },
  assetsNodeModulesRule: {
    test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|otf)$/,
    include: [paths.nodeModules.root],
    use: loaders.assetsNodeModules({ ssr: true }),
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

  return webpackMerge(serverConfig({ entry, rules }), {
    resolve: {
      modules: [paths.nodeModules.root, paths.server.sources, paths.client.sources, paths.root],
    },

    module: {
      rules: Object.getOwnPropertyNames(moduleRules).map(
        name => (moduleRules[name] ? moduleRules[name] : {})
      ),
    },

    plugins: [
      // Don't watch on client files when ssr is turned off.
      ...(reactEnv.ssr ? [] : [new webpack.WatchIgnorePlugin([paths.client.root])]),
    ],
  });
};
