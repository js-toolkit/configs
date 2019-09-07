import fs from 'fs';
import paths, { moduleExtensions } from '../paths';

module.exports = {
  extends: [
    require.resolve('./react.eslintrc.js'),
    require.resolve('./ts.common.eslintrc.js'),
    'prettier/react',
  ],

  parserOptions: {
    project: fs.existsSync(paths.client.tsconfig) ? paths.client.tsconfig : 'tsconfig.json',
  },

  rules: {
    'react/jsx-filename-extension': [
      'error',
      { extensions: moduleExtensions.filter(ext => ext.includes('sx')) },
    ],
    'react/jsx-wrap-multilines': 'off',
    'react/jsx-props-no-spreading': 'off',
  },
};
