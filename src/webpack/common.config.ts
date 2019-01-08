import path from 'path';
import webpack, { Options, Configuration } from 'webpack';
import appEnv from '../appEnv';
import paths from '../paths';
import { BaseTsOptions } from './loaders';

export interface CommonConfigOptions extends Partial<BaseTsOptions> {
  outputPath: string;
  outputPublicPath: string;
  outputJsDir: string;
  hash?: boolean;
  useTypeScript?: boolean;
}

function getTsExtensions() {
  return ['.ts', '.tsx', '.d.ts'];
}

export default ({
  outputPath,
  outputPublicPath,
  outputJsDir,
  hash,
  useTypeScript,
  tsconfig,
}: CommonConfigOptions): Configuration => ({
  // The base directory (absolute path!) for resolving the `entry` option.
  context: paths.root,

  output: {
    path: outputPath,
    publicPath: outputPublicPath,
    pathinfo: appEnv.ifDevMode(true, false),
    filename: path.join(outputJsDir, `[name].js${hash ? '?[hash:5]' : ''}`),
    // chunkFilename: path.join(outputFilePath, `[id].js${hash ? '?[chunkhash]' : ''}`),
  },

  mode: appEnv.raw.NODE_ENV,

  // Stop compilation early in production
  bail: appEnv.prod,

  // http://cheng.logdown.com/posts/2016/03/25/679045
  devtool: appEnv.ifDevMode<Options.Devtool>('cheap-module-eval-source-map', false),

  plugins: [
    // In order for the specified environment variables to be available in the JS code.
    // EnvironmentPlugin not working on client side with ssr because environment variables not passed to webpackDevMiddleware?
    new webpack.DefinePlugin(appEnv.stringified),
  ],

  resolve: {
    extensions: ['.js', '.jsx', ...(useTypeScript ? getTsExtensions() : [])],
    modules: [paths.nodeModules.root, paths.root],
    plugins: [
      ...(useTypeScript
        ? [new (require('tsconfig-paths-webpack-plugin'))({ configFile: tsconfig })]
        : []),
    ],
  },
});
