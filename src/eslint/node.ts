import fs from 'fs';
import path from 'path';
import buildConfig from '../buildConfig';
import paths, { getTSExtensions } from '../paths';
import { eslintTsProject } from './consts';

const enabled = buildConfig.server && fs.existsSync(paths.server.root);

const config: import('eslint').Linter.Config = {
  extends: [require.resolve('./common')],

  env: {
    node: true,
  },

  // settings: {
  //   'import/resolver': {
  //     node: {}, // Add priority
  //     ...(enabled && buildConfig.server && buildConfig.server.webpackConfig
  //       ? { webpack: { config: buildConfig.server.webpackConfig } }
  //       : undefined),
  //   },
  // },

  overrides: [
    {
      files: getTSExtensions().map((ext) => `*${ext}`),

      parserOptions: {
        project: (() => {
          if (enabled) {
            const tsconfig = path.join(paths.server.root, eslintTsProject);
            if (fs.existsSync(tsconfig)) return tsconfig;
            if (fs.existsSync(paths.server.tsconfig)) return paths.server.tsconfig;
          }
          return fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json';
        })(),
      },
    },
  ],
};

module.exports = config;
