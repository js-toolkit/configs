import fs from 'fs';
import path from 'path';
import type { Linter } from 'eslint';
import buildConfig, { type BuildConfig } from '../buildConfig';
import paths, { getFilesGlob, moduleExtensions } from '../paths';
import { eslintTsProject } from './consts';

// function getFilesGlob(basePath: string): string[] {
//   return moduleExtensions.map((e) => `${basePath || '.'}/**/*${e}`);
// }

const filesGlobs: Record<keyof Pick<BuildConfig, 'web' | 'node' | 'shared'> | 'other', string[]> = {
  web:
    buildConfig.web && fs.existsSync(paths.web.root)
      ? [getFilesGlob(moduleExtensions, buildConfig.web.root)]
      : [],
  node:
    buildConfig.node && fs.existsSync(paths.node.root)
      ? [getFilesGlob(moduleExtensions, buildConfig.node.root)]
      : [],
  shared:
    buildConfig.shared && fs.existsSync(paths.shared.root)
      ? [getFilesGlob(moduleExtensions, buildConfig.shared.root)]
      : [],
  other: moduleExtensions.map((ext) => `*${ext}`),
};

const config: Linter.FlatConfig[] = [
  {
    // Add to settings because we can export only valid configuration object without other named exports.
    settings: { filesGlobs, getFilesGlob },
  },

  ...(filesGlobs.web.length > 0
    ? [
        {
          files: filesGlobs.web,
          rules: {},
        },
        ...require('./react'),
      ]
    : []),

  ...(filesGlobs.node.length > 0
    ? [
        {
          files: filesGlobs.node,
          rules: {},
        },
        ...require('./react'),
        ...require('./node'),
      ]
    : []),

  ...(filesGlobs.shared.length > 0
    ? [
        {
          files: filesGlobs.shared,
          // env: {
          //   'shared-node-browser': true,
          // },
          parserOptions: {
            project: (() => {
              const tsconfig = path.join(paths.shared.root, eslintTsProject);
              if (fs.existsSync(tsconfig)) return tsconfig;
              if (fs.existsSync(paths.shared.tsconfig)) return paths.shared.tsconfig;
              return fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json';
            })(),
          },
          rules: {},
        },
        ...require('./common'),
      ]
    : []),

  ...(filesGlobs.other.length > 0
    ? [
        {
          files: filesGlobs.other,
          // excludedFiles: [...filesGlobs.web, ...filesGlobs.node, ...filesGlobs.shared].filter(
          //   Boolean
          // ),
          ignores: [...filesGlobs.web, ...filesGlobs.node, ...filesGlobs.shared].filter(Boolean),
          rules: {},
        },
        ...require('./common'),
      ]
    : []),
];

module.exports = config;
