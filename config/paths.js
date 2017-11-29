import path from 'path';

const baseDir = process.cwd();

export default {
  context: baseDir,

  // output: {
  // path: path.resolve(baseDir, 'dist'),
  // publicPath: '/',
  // },

  nodeModules: {
    dirname: 'node_modules',
    path: path.resolve(baseDir, 'node_modules'),
    bootstrap: path.resolve(baseDir, 'node_modules/bootstrap'),
    fontAwesome: path.resolve(baseDir, 'node_modules/font-awesome'),
  },

  client: {
    root: path.resolve(baseDir, 'client'),
    sources: path.resolve(baseDir, 'client/src'),
    assets: path.resolve(baseDir, 'client/src/assets'),
    output: {
      path: path.resolve(baseDir, 'dist/client'),
      // If multiple webpack configurations (i.e. client and server)
      // and used forked? process with express server
      // then for url-loader (fonts) must be equals to path suffix if path is subdir of output path.
      // publicPath: '/client/',
      publicPath: '/',
      dir: 'client',
      js: 'js',
      styles: 'styles',
      assets: 'assets',
      external: 'lib',
    },
  },

  server: {
    root: path.resolve(baseDir, 'server'),
    sources: path.resolve(baseDir, 'server'),
    output: {
      path: path.resolve(baseDir, 'dist/server'),
      publicPath: '/',
    },
  },

  shared: {
    root: path.resolve(baseDir, 'shared'),
  },

  devServer: {
    contentBase: path.resolve(baseDir, 'client/public'),
  },

  get publicUrl() {
    return this.client.output.publicPath.slice(0, -1);
  },
};
