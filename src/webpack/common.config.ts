import path from 'path';
import webpack, { Options, Configuration } from 'webpack';
import appEnv from '../appEnv';
import appConfig from '../appConfig';
import paths, { moduleExtensions } from '../paths';
import loaders, { BaseTsOptions, TsLoaderType, GetTsCheckerPluginOptions } from './loaders';

export interface CommonConfigOptions extends Partial<BaseTsOptions> {
  outputPath: string;
  outputPublicPath: string;
  outputJsDir: string;
  hash?: boolean;
  useTypeScript?: boolean;
  tsLoaderType?: TsLoaderType;
}

export default ({
  outputPath,
  outputPublicPath,
  outputJsDir,
  hash,
  useTypeScript,
  tsLoaderType = TsLoaderType.Default,
  tsconfig,
}: CommonConfigOptions): Configuration => ({
  // The base directory (absolute path!) for resolving the `entry` option.
  context: paths.root,

  output: {
    path: outputPath,
    publicPath: outputPublicPath,
    pathinfo: appEnv.ifDevMode(true, false),
    filename: path.join(outputJsDir, `[name]${appEnv.prod && hash ? '.[hash:5]' : ''}.js`),
    chunkFilename: path.join(
      outputJsDir,
      `[name]${appEnv.prod && hash ? '.[chunkhash:8]' : ''}.chunk.js`
    ),
  },

  mode: appEnv.raw.NODE_ENV,

  // Stop compilation early in production
  bail: appEnv.prod,

  // http://cheng.logdown.com/posts/2016/03/25/679045
  devtool: appEnv.ifDevMode<Options.Devtool>('cheap-module-eval-source-map', false),

  plugins: [
    // In order for the specified environment variables to be available in the JS code.
    // EnvironmentPlugin not working on client side with ssr because environment variables not passed to webpackDevMiddleware?
    new webpack.DefinePlugin({
      // Replace process.env... and appEnv.raw... to static values in the bundle.
      ...appEnv.envStringify(),
      // Replace appConfig... to static values in the bundle.
      ...appConfig.envStringify(),
    }),
    // Enable HMR in development.
    ...appEnv.ifDevMode([new webpack.HotModuleReplacementPlugin()], []),
    // Forked check for TS
    ...(useTypeScript
      ? [
          loaders.getTsCheckerPlugin({
            loaderType: tsLoaderType,
            tsconfig,
          } as GetTsCheckerPluginOptions),
        ]
      : []),
  ],

  resolve: {
    extensions: moduleExtensions.filter(ext => useTypeScript || !ext.includes('ts')),
    modules: [paths.nodeModules.root, paths.root],
    plugins: [
      ...(useTypeScript
        ? [new (require('tsconfig-paths-webpack-plugin'))({ configFile: tsconfig })]
        : []),
    ],
  },

  module: {
    rules: [],
    // To suppress warning with 'Critical dependency: require function is used in a way in which dependencies cannot be statically extracted'
    exprContextCritical: false,
    // To suppress warning with 'Critical dependency: the request of a dependency is an expression'
    unknownContextCritical: false,
  },
});
