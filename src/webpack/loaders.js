import appEnv from '../appEnv';
import paths, { dirMap } from '../paths';

export default {
  ts({ tsconfig, forkedChecks, afterLoaders, ...rest }) {
    return [
      ...(forkedChecks && appEnv.prod
        ? [
            // Must be placen on front of other loaders.
            // Useful without watch mode, because on every edit (compilation) thread-loader fork process and increase total time of build
            {
              loader: 'thread-loader',
              options: {
                // there should be 1 cpu for the fork-ts-checker-webpack-plugin
                workers: 1, // best for universal builds
              },
            },
          ]
        : []),

      ...(afterLoaders || []),

      {
        loader: 'ts-loader',
        options: {
          configFile: tsconfig,
          transpileOnly: forkedChecks,
          happyPackMode: forkedChecks && appEnv.prod, // use happyPackMode mode to speed-up compilation and reduce errors reported to webpack
          ...rest,
        },
      },
    ];
  },

  tsRHL4({ tsconfig, forkedChecks, afterLoaders, ...rest }) {
    return this.ts({
      tsconfig,
      forkedChecks,
      afterLoaders: [
        ...(afterLoaders || []),
        // Necessary for RHL4.
        // Not working with RHL3 and DateRangePicker.
        ...appEnv.ifDevMode([{ loader: 'babel-loader' }], []),
      ],
      ...rest,
    });
  },

  tsRHL3({ tsconfig, forkedChecks, afterLoaders, ...rest }) {
    return this.ts({
      tsconfig,
      forkedChecks,
      afterLoaders: [
        ...(afterLoaders || []),
        ...appEnv.ifDevMode([{ loader: 'react-hot-loader/webpack' }], []),
      ],
      ...rest,
    });
  },

  /** In order to runs typescript type checker on a separate process. */
  tsCheckerPlugin({ tsconfig, ...rest }) {
    const Plugin = require('fork-ts-checker-webpack-plugin');
    return new Plugin({
      tsconfig,
      checkSyntacticErrors: appEnv.prod,
      memoryLimit: 1024,
      ...rest,
    });
  },

  ats({ tsconfig, ...rest }) {
    return {
      loader: 'awesome-typescript-loader',
      options: {
        configFileName: tsconfig,
        useBabel: false, // Also sets "target": "es201*" in tsconfig.json
        useCache: true,
        ...rest,
      },
    };
  },

  atsRHL4({ tsconfig, ...rest }) {
    return [
      // Necessary for RHL4.
      // Not working with RHL3 and DateRangePicker.
      ...appEnv.ifDevMode([{ loader: 'babel-loader' }], []),
      this.ats({ tsconfig, ...rest }),
    ];
  },

  atsRHL3({ tsconfig, ...rest }) {
    return [
      ...appEnv.ifDevMode([{ loader: 'react-hot-loader/webpack' }], []),
      this.ats({ tsconfig, ...rest }),
    ];
  },

  /** In order to runs typescript type checker on a separate process. */
  atsCheckerPlugin() {
    const { CheckerPlugin } = require('awesome-typescript-loader');
    return new CheckerPlugin();
  },

  babel(options) {
    return {
      loader: 'babel-loader',
      options: {
        cacheDirectory: true,
        ...options,
      },
    };
  },

  css({ ssr, pattern = '[name]__[local]--[hash:5]', prodPattern = '[hash:5]', ...rest } = {}) {
    return [
      {
        loader: ssr ? 'css-loader/locals' : 'css-loader',
        options: {
          modules: true,
          localIdentName: appEnv.ifDevMode(pattern, prodPattern),
          context: paths.root, // https://github.com/webpack-contrib/css-loader/issues/267
          importLoaders: 1,
          // !!! Removed in v1.0.0 in favor of postcss-loader cssnano plugin.
          // minimize: appEnv.ifDevMode(false, {
          //   preset: ['default', { discardComments: { removeAll: true } }],
          // }),
          ...rest,
        },
      },
      'postcss-loader', // https://github.com/postcss/postcss-import/issues/224
    ];
  },

  cssNodeModules({ ssr, localIdentName = '[local]', postcss } = {}) {
    return [
      ...(ssr
        ? []
        : appEnv.ifDevMode(
            [{ loader: 'style-loader' }],
            // In production mode extract processed css and save result to file.
            [
              {
                // todo: in production add link to file in html file
                loader: 'file-loader',
                options: {
                  regExp: 'node_modules(?:/|\\\\)(.*)',
                  name: `${dirMap.client.output.external}/[1]`,
                },
              },
              {
                loader: 'extract-loader',
                options: {
                  publicPath: dirMap.client.output.publicPath,
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
    ];
  },

  assets({ ssr } = {}) {
    return {
      // Embeds resources as DataUrl, or if the file size exceeds options.limit then redirects
      // to the file-loader with all specified parameters and it copies the files.
      loader: 'url-loader',
      options: {
        emitFile: !ssr,
        limit: 1024,
        name: `${dirMap.client.output.assets}/[name].[ext]?[hash:base64:5]`, // Virtual hash for HRM during development.
      },
    };
  },

  assetsNodeModules({ ssr } = {}) {
    return {
      loader: 'file-loader',
      options: {
        emitFile: !ssr,
        regExp: 'node_modules(?:/|\\\\)(.*)',
        name: `${dirMap.client.output.external}/[1]`,
      },
    };
  },
};
