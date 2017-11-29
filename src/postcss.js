export default ({ importPath }) => ({
  plugins: {
    'postcss-import': { path: rootPath },
    'postcss-icss-values': {},
    'postcss-nested': {},
  },
});
