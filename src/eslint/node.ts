import fs from 'fs';
import path from 'path';
import buildConfig from '../buildConfig';
import paths, { getFilesGlob, getTSExtensions } from '../paths';
import { eslintTsProject } from './consts';

const enabled = buildConfig.node && fs.existsSync(paths.node.root);

const config: import('eslint').Linter.Config[] = [
  ...require('./common'),
  // {
  //   env: {
  //     node: true,
  //   },

  //   // settings: {
  //   //   'import/resolver': {
  //   //     node: {}, // Add priority
  //   //     ...(enabled && buildConfig.server && buildConfig.server.webpackConfig
  //   //       ? { webpack: { config: buildConfig.server.webpackConfig } }
  //   //       : undefined),
  //   //   },
  //   // },
  // },
  {
    files: [getFilesGlob(getTSExtensions())],

    languageOptions: {
      parserOptions: {
        project: (() => {
          if (enabled) {
            const tsconfig = path.join(paths.node.root, eslintTsProject);
            if (fs.existsSync(tsconfig)) return tsconfig;
            if (fs.existsSync(paths.node.tsconfig)) return paths.node.tsconfig;
          }
          return fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json';
        })(),
      },
    },
  },
];

module.exports = config;
