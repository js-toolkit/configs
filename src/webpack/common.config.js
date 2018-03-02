import webpack from 'webpack';
import reactEnv from '../reactEnv';
import paths from '../paths';

export default ({ outputPath, outputPublicPath }) => ({
  // The base directory (absolute path!) for resolving the `entry` option.
  context: paths.root,

  output: {
    path: outputPath,
    publicPath: outputPublicPath,
    pathinfo: reactEnv.ifDevMode(true, false),
    filename: `${paths.client.output.js}/[name].js`,
  },

  mode: reactEnv.raw.NODE_ENV,
  
  // http://cheng.logdown.com/posts/2016/03/25/679045
  devtool: reactEnv.ifDevMode('cheap-module-eval-source-map', ''),

  plugins: [
    // In order for the specified environment variables to be available in the JS code.
    new webpack.EnvironmentPlugin(reactEnv.raw),
    // Keeps hashes consistent between compilations
    // Deprecated in webpack 4
    // new webpack.optimize.OccurrenceOrderPlugin(),
    // Prints more readable module names in the browser console on HMR updates.
    new webpack.NamedModulesPlugin(),
    // In order for don't emit files if errors occurred.
    // new webpack.NoEmitOnErrorsPlugin(),
  ],

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
});
