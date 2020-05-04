import fs from 'fs';
import path from 'path';
import paths from '../paths';
import { eslintTsProject } from './consts';

const config: import('eslint').Linter.Config = {
  extends: [require.resolve('./node.eslintrc.js'), require.resolve('./ts.common.eslintrc.js')],

  parserOptions: {
    project: (() => {
      if (fs.existsSync(path.join(paths.server.root, eslintTsProject)))
        return path.join(paths.server.root, eslintTsProject);
      if (fs.existsSync(paths.server.tsconfig)) return paths.server.tsconfig;
      return fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json';
    })(),
  },
};

module.exports = config;
