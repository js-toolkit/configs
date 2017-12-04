export default ({ importPath }) => ({
  plugins: {
    autoprefixer: {},
    'postcss-import': { path: importPath },
    'postcss-icss-values': {},
    'postcss-nested': {},
  },
});
