import fs from 'fs';
import path from 'path';
import paths, { moduleExtensions } from '../paths';
import { eslintTsProject } from './consts';

module.exports = {
  extends: [
    require.resolve('./react.eslintrc.js'),
    require.resolve('./ts.common.eslintrc.js'),
    'prettier/react',
  ],

  parserOptions: {
    project: (() => {
      if (fs.existsSync(path.join(paths.client.root, eslintTsProject)))
        return path.join(paths.client.root, eslintTsProject);
      if (fs.existsSync(paths.client.tsconfig)) return paths.client.tsconfig;
      return 'tsconfig.json';
    })(),
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
