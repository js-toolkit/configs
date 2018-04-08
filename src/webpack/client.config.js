import webpack from 'webpack';
import webpackMerge from 'webpack-merge';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import reactEnv from '../reactEnv';
import paths, { dirMap } from '../paths';
import commonConfig from './common.config';
import loaders from './loaders';

export const defaultRules = {
  jsRule: {
    test: /\.jsx?$/,
    include: [paths.client.sources, paths.shared.sources],
    use: loaders.babel(),
  },
  cssRule: {
    test: /\.css$/,
    include: [paths.client.sources],
    use: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: loaders.css({
        minimize: reactEnv.ifDevMode(false, {
          preset: ['default', { discardComments: { removeAll: true } }],
        }),
      }),
    }),
  },
  cssNodeModulesRule: {
    test: /\.css$/,
    include: [paths.nodeModules.root],
    // use: loaders.cssNodeModules(),
    use: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: loaders.css({
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
    include: [paths.client.assets, paths.nodeModules.root],
    use: loaders.assets(),
  },
  // assetsNodeModulesRule: {
  //   test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|otf)$/,
  //   include: [paths.nodeModules.root],
  //   use: loaders.assetsNodeModules(),
  // },
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
      outputPath: paths.client.output.path,
      outputPublicPath: paths.client.output.publicPath,
    }),
    {
      name: dirMap.client.root,
      target: 'web',

      context: paths.client.sources,

      entry,

      resolve: {
        modules: [paths.client.sources],
      },

      // recordsOutputPath: path.join(paths.output.path, 'webpack.client.stats.json'),

      module: {
        rules: Object.getOwnPropertyNames(moduleRules).map(name => moduleRules[name] || {}),
      },

      plugins: [
        // To extract a common code to single separate file.
        // Deprecated with webpack 4
        // new webpack.optimize.CommonsChunkPlugin({
        //   name: 'vendor', // Add link to this file in html before other JS/CSS files, it has a common code.
        //   minChunks: ({ context }) => context && context.indexOf(paths.nodeModules.dirname) >= 0, // Only from node_modules.
        // }),
        // Saves received text to the file, for example css from style-loader and css-loader.
        new ExtractTextPlugin({
          filename: `${paths.client.output.styles}/[name].css`,
          disable: reactEnv.dev,
          allChunks: true,
        }),
        ...reactEnv.ifDevMode(
          [
            // Enable HMR in development.
            new webpack.HotModuleReplacementPlugin(),
          ],
          [
            // Minificate code in production.
            // new UglifyJsPlugin(), // Deprecated in webpack 4
          ]
        ),
      ],

      devServer: {
        // Static content which not processed by webpack and loadable from disk.
        contentBase: paths.client.staticContent,
        publicPath: paths.client.output.publicPath,
        historyApiFallback: true, // For react subpages handling with webpack-dev-server
        host: '0.0.0.0',
        port: 9000,
        hotOnly: true,
        noInfo: false,
        stats: 'minimal',
        // stats: {
        //   colors: true,
        //   errors: true,
        //   warnings: true,
        //   modules: false,
        //   assets: false,
        //   cached: false,
        //   cachedAssets: false,
        // },
      },
    }
  );
};
