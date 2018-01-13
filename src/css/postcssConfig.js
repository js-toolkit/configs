export default ({ importPath }) => ({
  plugins: {
    'postcss-import': { path: importPath },
    'postcss-icss-values': {},
    'postcss-nested': {},
  },
});
