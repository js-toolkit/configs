import webpack, { Configuration } from 'webpack';
import path from 'path';
import appEnv from '../appEnv';
import buildConfig from '../buildConfig';
import paths, { moduleExtensions } from '../paths';
import loaders, { TsLoaderType } from './loaders';
import nodeRequire from './nodeRequire';

export interface CommonConfigOptions extends Configuration {
  outputPath: string;
  outputPublicPath: string;
  outputJsDir: string;
  hash?: boolean | { entry: boolean; chunk: boolean };
  chunkSuffix?: string;
  typescript?: {
    configFile?: string;
    loader?: TsLoaderType;
    forkedChecks?: boolean;
    /** Forked checks webpack plugin options */
    checkerOptions?: Record<string, any>;
  };
  terserPluginOptions?: Record<string, any>;
}

export default ({
  outputPath,
  outputPublicPath,
  outputJsDir,
  hash,
  chunkSuffix = '.chunk',
  typescript,
  terserPluginOptions,
  ...restOptions
}: CommonConfigOptions): Configuration => {
  const entryHash = hash === true || (typeof hash === 'object' && hash.entry);
  const chunkHash = hash === true || (typeof hash === 'object' && hash.chunk);

  return {
    // The base directory (absolute path!) for resolving the `entry` option.
    context: paths.root,

    mode: appEnv.raw.NODE_ENV,

    // Stop compilation early in production
    bail: appEnv.prod,

    // http://cheng.logdown.com/posts/2016/03/25/679045
    devtool: appEnv.ifDev<NonNullable<webpack.Configuration['devtool']>>(
      webpack.version.startsWith('5')
        ? 'eval-cheap-module-source-map'
        : 'cheap-module-eval-source-map',
      false
    ),

    ...restOptions,

    output: {
      path: outputPath,
      publicPath: outputPublicPath,
      pathinfo: false, // For speed up
      filename: path.join(
        outputJsDir,
        `[name]${appEnv.prod && entryHash ? '.[contenthash:8]' : ''}.js`
      ),
      chunkFilename: path.join(
        outputJsDir,
        `[name]${appEnv.prod && chunkHash ? '.[contenthash:8]' : ''}${chunkSuffix ?? ''}.js`
      ),
      ...restOptions.output,
    },

    optimization: {
      ...restOptions.optimization,
      ...appEnv.ifProd(
        () => ({
          minimizer: [
            new (nodeRequire('terser-webpack-plugin'))({
              extractComments: false,
              ...terserPluginOptions,
              terserOptions: {
                ...terserPluginOptions?.terserOptions,
                output: {
                  comments: false,
                  ...terserPluginOptions?.terserOptions?.output,
                },
              },
            }),
            ...(restOptions.optimization?.minimizer || []),
          ],
        }),
        undefined
      ),
    },

    plugins: [
      // In order for the specified environment variables to be available in the JS code.
      // EnvironmentPlugin not working on client side with ssr because environment variables not passed to webpackDevMiddleware?
      new webpack.DefinePlugin({
        // Replace process.env... and appEnv.raw... to static values in the bundle.
        ...appEnv.envStringify(),
        // Replace config... to static values in the bundle.
        ...buildConfig.envStringify(),
      }),

      // Enable HMR in development.
      ...appEnv.ifDev(() => [new webpack.HotModuleReplacementPlugin()], []),

      // Forked check for TS
      ...(typescript && typescript.forkedChecks && typescript.configFile
        ? [
            loaders.getTsCheckerPlugin({
              loaderType: typescript.loader ?? TsLoaderType.Default,
              ...typescript.checkerOptions,
              typescript: {
                configFile: typescript.configFile,
                ...typescript.checkerOptions?.typescript,
              },
            }),
          ]
        : []),

      // Ignore all locale files of moment.js
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      (webpack.version ?? '').startsWith('5')
        ? new webpack.IgnorePlugin({ contextRegExp: /moment$/, resourceRegExp: /^\.\/locale$/ })
        : // @ts-ignore
          new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      ...(restOptions.plugins || []),
    ],

    resolve: {
      ...restOptions.resolve,
      extensions: [
        ...(typescript ? moduleExtensions : moduleExtensions.filter((ext) => !ext.includes('ts'))),
        ...((restOptions.resolve && restOptions.resolve.extensions) || []),
      ],
      modules: [
        'node_modules',
        paths.root,
        ...((restOptions.resolve && restOptions.resolve.modules) || []),
      ],
      plugins: [
        ...(typescript
          ? [
              (() => {
                const getName = (): string => 'tsconfig-paths-webpack-plugin';
                const TSConfigPathsWebpackPlugin = nodeRequire(getName());
                return new TSConfigPathsWebpackPlugin({ configFile: typescript.configFile });
              })(),
            ]
          : []),
        ...((restOptions.resolve && restOptions.resolve.plugins) || []),
      ],
    },

    ...((webpack.version ?? '').startsWith('5')
      ? {
          ignoreWarnings: [
            // https://github.com/TypeStrong/ts-loader#transpileonly-boolean-defaultfalse
            ...(typescript ? [/export .* was not found in/] : []),
            ...(restOptions.ignoreWarnings ?? []),
          ],
        }
      : {
          stats:
            restOptions.stats == null || typeof restOptions.stats === 'object'
              ? {
                  ...(typescript
                    ? // https://github.com/TypeStrong/ts-loader#transpileonly-boolean-defaultfalse
                      { warningsFilter: /export .* was not found in/ }
                    : undefined),
                  ...restOptions.stats,
                }
              : restOptions.stats,
        }),

    module: {
      // Suppress warnings of dynamic requiring in configs:
      // To suppress warning with 'Critical dependency: require function is used in a way in which dependencies cannot be statically extracted'
      exprContextCritical: false,
      // To suppress warning with 'Critical dependency: the request of a dependency is an expression'
      unknownContextCritical: false,
      ...restOptions.module,
      rules: (restOptions.module && restOptions.module.rules) || [],
    },
  };
};
