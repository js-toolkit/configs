export default Object.freeze({
  output: {
    root: 'dist',
  },

  client: {
    root: 'client',
    sources: 'src',
    assets: 'src/assets',
    staticContent: 'public',

    html: {
      template: 'assets/index.pug',
      filename: 'index.html',
      title: 'App',
    },

    webpackConfig: '',
    tsconfig: 'tsconfig.json',

    output: {
      root: 'client',
      js: 'js',
      styles: 'styles',
      assets: 'assets',
      external: 'lib',
      publicPath: '/',

      /** Generated asset manifest */
      assetManifest: {
        fileName: 'asset-manifest.json',
        filterTemplate: {},
      },

      /** Generated service worker file name */
      swFile: 'service-worker.js',
    },
  },

  server: {
    root: 'server',
    sources: 'src',

    webpackConfig: '',
    tsconfig: 'tsconfig.json',

    output: {
      root: 'server',
      publicPath: '/',
    },
  },

  shared: {
    root: 'shared',
    sources: 'src',
    tsconfig: 'tsconfig.json',
  },
});