import path from 'path';
import webpack, { Options, Configuration } from 'webpack';
import appEnv from '../appEnv';
import paths, { dirMap } from '../paths';

export interface CommonConfigOptions {
  outputPath: string;
  outputPublicPath: string;
  hash?: boolean;
}

export default ({ outputPath, outputPublicPath, hash }: CommonConfigOptions): Configuration => ({
  // The base directory (absolute path!) for resolving the `entry` option.
  context: paths.root,

  output: {
    path: outputPath,
    publicPath: outputPublicPath,
    pathinfo: appEnv.ifDevMode(true, false),
    filename: path.join(dirMap.client.output.js, `[name].js${hash ? '?[hash:5]' : ''}`),
    // chunkFilename: path.join(dirMap.client.output.js, `[id].js${hash ? '?[chunkhash]' : ''}`),
  },

  mode: appEnv.raw.NODE_ENV,

  // http://cheng.logdown.com/posts/2016/03/25/679045
  devtool: appEnv.ifDevMode<Options.Devtool>('cheap-module-eval-source-map', false),

  plugins: [
    // In order for the specified environment variables to be available in the JS code.
    // EnvironmentPlugin not working on client side with ssr because environment variables not passed to webpackDevMiddleware?
    new webpack.DefinePlugin(appEnv.stringified),
  ],

  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [paths.nodeModules.root, paths.root],
  },
});
