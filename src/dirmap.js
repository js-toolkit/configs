export default Object.freeze({
  output: {
    root: 'dist',
  },

  client: {
    root: 'client',
    sources: 'src',
    assets: 'src/assets',
    staticContent: 'public',

    tsconfig: 'tsconfig.json',

    output: {
      root: 'client',
      js: 'js',
      styles: 'styles',
      assets: 'assets',
      external: 'lib',
      publicPath: '/',
    },
  },

  server: {
    root: 'server',
    sources: 'src',

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
