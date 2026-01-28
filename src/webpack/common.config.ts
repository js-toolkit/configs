import webpack from 'webpack';
import path from 'path';
import type { OptionalToUndefined } from '../types';
import appEnv from '../appEnv';
import buildConfig from '../buildConfig';
import paths, { getJSExtensions, moduleExtensions } from '../paths';
import { TsLoaderType, getTsCheckerPlugin } from './loaders';
import nodeRequire from './nodeRequire';

export interface CommonConfigOptions extends OptionalToUndefined<webpack.Configuration> {
  outputPath: string;
  outputPublicPath: string;
  outputJsDir: string;
  hash?: boolean | { entry: boolean; chunk: boolean } | undefined;
  chunkSuffix?: string | undefined;
  typescript?:
    | {
        configFile?: string | undefined;
        loader?: TsLoaderType | undefined;
        forkedChecks?: boolean | undefined;
        /** Forked checks webpack plugin options */
        checkerOptions?: Record<string, any> | undefined;
      }
    | undefined;
  /** Default `terser`. */
  minimizerPlugin?: 'terser' | 'closure';
  minimizerPluginOptions?: Record<string, any> | readonly Record<string, any>[] | undefined;
}

export default ({
  outputPath,
  outputPublicPath,
  outputJsDir,
  hash,
  chunkSuffix = '.chunk',
  typescript,
  minimizerPlugin = 'terser',
  minimizerPluginOptions,
  ...restOptions
}: CommonConfigOptions): webpack.Configuration => {
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
      'eval-cheap-module-source-map',
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
        {
          minimizer: [
            minimizerPlugin === 'terser' &&
              (() => {
                const options = Array.isArray(minimizerPluginOptions)
                  ? (minimizerPluginOptions as readonly Record<string, any>[]).reduce(
                      (acc, item) => ({ ...acc, ...item }),
                      {}
                    )
                  : (minimizerPluginOptions as Record<string, any>);
                return new (nodeRequire('terser-webpack-plugin'))({
                  extractComments: false,
                  ...options,
                  terserOptions: {
                    ...options?.terserOptions,
                    output: {
                      comments: false,
                      ...options?.terserOptions?.output,
                    },
                  },
                });
              })(),

            minimizerPlugin === 'closure' &&
              (() => {
                const [pluginOptions, compilerOptions] = Array.isArray(minimizerPluginOptions)
                  ? ((minimizerPluginOptions as readonly Record<string, any>[]) ?? [])
                  : [minimizerPluginOptions, undefined];

                return new (nodeRequire('closure-webpack-plugin'))(
                  // https://github.com/webpack-contrib/closure-webpack-plugin?tab=readme-ov-file#options
                  {
                    mode: 'STANDARD',
                    ...pluginOptions,
                  },
                  // https://github.com/google/closure-compiler/wiki/Flags-and-Options
                  {
                    ...appEnv.ifDev(
                      {
                        formatting: 'PRETTY_PRINT',
                        debug: true,
                        renaming: false,
                      },
                      undefined
                    ),
                    ...compilerOptions,
                  }
                );
              })(),

            ...(restOptions.optimization?.minimizer || []),
          ],
        },
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

      // Forked check for TS
      ...(typescript?.forkedChecks && typescript.configFile
        ? [
            getTsCheckerPlugin({
              loaderType: typescript.loader ?? TsLoaderType.Default,
              ...typescript.checkerOptions,
              typescript: {
                configFile: typescript.configFile,
                ...typescript.checkerOptions?.typescript,
              },
            }),
          ]
        : []),

      ...(restOptions.plugins || []),
    ],

    resolve: (() => {
      const extensions = [
        ...(typescript ? moduleExtensions : getJSExtensions()),
        ...(restOptions.resolve?.extensions || []),
      ];
      return {
        ...restOptions.resolve,
        extensions,
        modules: [
          'node_modules',
          paths.nodeModules.root,
          paths.root,
          ...(restOptions.resolve?.modules || []),
        ],
        plugins: [
          ...(typescript
            ? [
                (() => {
                  const getName = (): string => 'tsconfig-paths-webpack-plugin';
                  const TSConfigPathsWebpackPlugin = nodeRequire(getName());
                  return new TSConfigPathsWebpackPlugin({
                    configFile: typescript.configFile,
                    extensions,
                  });
                })(),
              ]
            : []),
          ...(restOptions.resolve?.plugins || []),
        ],
      };
    })(),

    ignoreWarnings: [
      // https://github.com/TypeStrong/ts-loader#transpileonly-boolean-defaultfalse
      ...(typescript ? [/export .* was not found in/] : []),
      ...(restOptions.ignoreWarnings ?? []),
    ],

    module: {
      // Suppress warnings of dynamic requiring in configs:
      // To suppress warning with 'Critical dependency: require function is used in a way in which dependencies cannot be statically extracted'
      exprContextCritical: false,
      // To suppress warning with 'Critical dependency: the request of a dependency is an expression'
      unknownContextCritical: false,
      ...restOptions.module,
      rules: restOptions.module?.rules || [],
    },
  } as webpack.Configuration;
};
