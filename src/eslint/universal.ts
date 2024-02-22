import fs from 'fs';
import path from 'path';
import type { Linter } from 'eslint';
import buildConfig, { type BuildConfig } from '../buildConfig';
import paths, { moduleExtensions } from '../paths';
import { eslintTsProject } from './consts';

function getFilesGlob(basePath: string): string[] {
  return moduleExtensions.map((e) => `${basePath || '.'}/**/*${e}`);
}

const filesGlobs: Record<keyof Pick<BuildConfig, 'web' | 'node' | 'shared'> | 'other', string[]> = {
  web: buildConfig.web && fs.existsSync(paths.web.root) ? getFilesGlob(buildConfig.web.root) : [],
  node:
    buildConfig.node && fs.existsSync(paths.node.root) ? getFilesGlob(buildConfig.node.root) : [],
  shared:
    buildConfig.shared && fs.existsSync(paths.shared.root)
      ? getFilesGlob(buildConfig.shared.root)
      : [],
  other: moduleExtensions.map((ext) => `*${ext}`),
};

const config: Linter.Config = {
  // Add to settings because we can export only valid configuration object without other named exports.
  settings: { filesGlobs, getFilesGlob },

  overrides: [
    ...(filesGlobs.web.length > 0
      ? [
          {
            files: filesGlobs.web,
            extends: [require.resolve('./react')],
            rules: {},
          },
        ]
      : []),

    ...(filesGlobs.node.length > 0
      ? [
          {
            files: filesGlobs.node,
            extends: [require.resolve('./react'), require.resolve('./node')],
            rules: {},
          },
        ]
      : []),

    ...(filesGlobs.shared.length > 0
      ? [
          {
            files: filesGlobs.shared,
            extends: [require.resolve('./common')],
            env: {
              'shared-node-browser': true,
            },
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
        ]
      : []),

    {
      files: filesGlobs.other,
      excludedFiles: [...filesGlobs.web, ...filesGlobs.node, ...filesGlobs.shared].filter(Boolean),
      extends: [require.resolve('./common')],
      rules: {},
    },
  ],
};

module.exports = config;
