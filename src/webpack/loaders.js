import reactEnv from '../reactEnv';
import paths from '../paths';

export default {
  ts: ({ tsconfig, forkedChecks }) => [
    ...(forkedChecks && reactEnv.prod
      ? [
          // useful without watch mode, because on every edit (compilation) thread-loader fork process and increase total time of build
          {
            loader: 'thread-loader',
            options: {
              // there should be 1 cpu for the fork-ts-checker-webpack-plugin
              workers: 1, // best for universal builds
            },
          },
        ]
      : []),
    {
      loader: 'ts-loader',
      options: {
        configFile: tsconfig,
        transpileOnly: forkedChecks,
        happyPackMode: forkedChecks, // use happyPackMode mode to speed-up compilation and reduce errors reported to webpack
      },
    },
  ],

  /** In order to runs typescript type checker on a separate process. */
  tsCheckerPlugin: ({ tsconfig }) => {
    const Plugin = require('fork-ts-checker-webpack-plugin');
    return new Plugin({
      tsconfig,
      checkSyntacticErrors: true,
    });
  },

  ats: ({ tsconfig }) => ({
    loader: 'awesome-typescript-loader',
    options: {
      configFileName: tsconfig,
      useBabel: false, // Also sets "target": "es201*" in tsconfig.json
      useCache: false,
    },
  }),

  /** In order to runs typescript type checker on a separate process. */
  atsCheckerPlugin: () => {
    const { CheckerPlugin } = require('awesome-typescript-loader');
    return new CheckerPlugin();
  },

  babel: () => ({
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
    },
  }),

  css: ({ ssr, context, pattern = '[name]__[local]--[hash:5]', prodPattern = '[hash:5]' } = {}) => [
    {
      loader: ssr ? 'css-loader/locals' : 'css-loader',
      options: {
        modules: true,
        localIdentName: reactEnv.ifDevMode(pattern, prodPattern),
        context, // https://github.com/webpack-contrib/css-loader/issues/267
        importLoaders: 1,
      },
    },
    'postcss-loader', // https://github.com/postcss/postcss-import/issues/224
  ],

  cssNodeModules: ({ ssr, localIdentName = '[local]', postcss } = {}) => [
    ...(ssr
      ? []
      : reactEnv.ifDevMode(
          [{ loader: 'style-loader' }],
          // In production mode extract processed css and save result to file.
          [
            {
              // todo: in production add link to file in html file
              loader: 'file-loader',
              options: {
                regExp: 'node_modules(?:/|\\\\)(.*)',
                name: `${paths.client.output.external}/[1]`,
              },
            },
            {
              loader: 'extract-loader',
              options: {
                publicPath: paths.client.output.publicPath,
              },
            },
          ]
        )),
    {
      loader: ssr ? 'css-loader/locals' : 'css-loader',
      options: {
        modules: true,
        camelCase: false,
        sourceMap: false,
        localIdentName,
        importLoaders: postcss ? 1 : undefined,
      },
    },
    ...(postcss ? ['postcss-loader'] : []),
  ],

  assets: ({ ssr } = {}) => ({
    // Embeds resources as DataUrl, or if the file size exceeds options.limit then redirects
    // to the file-loader with all specified parameters and it copies the files.
    loader: 'url-loader',
    options: {
      emitFile: !ssr,
      limit: 1024,
      name: `${paths.client.output.assets}/[name].[ext]?[hash:base64:5]`, // Virtual hash for HRM during development.
    },
  }),

  assetsNodeModules: ({ ssr } = {}) => ({
    loader: 'file-loader',
    options: {
      emitFile: !ssr,
      regExp: 'node_modules(?:/|\\\\)(.*)',
      name: `${paths.client.output.external}/[1]`,
    },
  }),
};
