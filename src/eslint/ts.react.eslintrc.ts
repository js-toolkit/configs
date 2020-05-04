import fs from 'fs';
import path from 'path';
import paths, { moduleExtensions } from '../paths';
import { eslintTsProject } from './consts';

const config: import('eslint').Linter.Config = {
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
      return fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json';
    })(),
  },

  rules: {
    'react/jsx-filename-extension': [
      'error',
      { extensions: moduleExtensions.filter((ext) => ext.includes('sx')) },
    ],
  },
};

module.exports = config;
