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

  devtool: reactEnv.ifDevMode('inline-source-map', ''), // https://github.com/commissure/redbox-react#sourcemaps-with-webpack

  plugins: [
    // In order for the specified environment variables to be available in the JS code.
    new webpack.EnvironmentPlugin(reactEnv.raw),
    // Keeps hashes consistent between compilations
    new webpack.optimize.OccurrenceOrderPlugin(),
    // Prints more readable module names in the browser console on HMR updates.
    new webpack.NamedModulesPlugin(),
    // In order for don't emit files if errors occurred.
    // new webpack.NoEmitOnErrorsPlugin(),
  ],

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
});
