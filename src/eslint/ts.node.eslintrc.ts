import paths from '../paths';

module.exports = {
  extends: [require.resolve('./node.eslintrc.js'), require.resolve('./ts.common.eslintrc.js')],

  parserOptions: {
    project: paths.server.tsconfig,
  },
};
