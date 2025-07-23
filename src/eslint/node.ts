import fs from 'fs';
import path from 'path';
import type { Linter } from 'eslint';
import buildConfig from '../buildConfig';
import paths, { getFilesGlob, getTSExtensions } from '../paths';
import { eslintTsProject } from './consts';

const nodeConfigEnabled = buildConfig.node && fs.existsSync(paths.node.root);

const config: Linter.Config[] = [
  // ...require('./common'),

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

  ...(nodeConfigEnabled
    ? (() => {
        let eslintTsConfig = path.join(paths.node.root, eslintTsProject);
        if (!fs.existsSync(eslintTsConfig)) {
          eslintTsConfig = paths.node.tsconfig;
        }
        if (!fs.existsSync(eslintTsConfig)) {
          eslintTsConfig = '';
        }
        if (!eslintTsConfig) {
          return [];
        }
        return [
          {
            files: [getFilesGlob(getTSExtensions())],
            languageOptions: { parserOptions: { project: path.resolve(eslintTsConfig) } },
          } satisfies Linter.Config,
        ];
      })()
    : []),
];

module.exports = config;
export default config;
