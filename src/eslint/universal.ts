/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import fs from 'fs';
import type { Linter } from 'eslint';
import { defaultRequire } from '../defaultRequire.ts';
import buildConfig, { type BuildConfig } from '../buildConfig.ts';
import paths, { getFilesGlob, moduleExtensions } from '../paths.ts';

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

const config: Linter.Config[] = [
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
        ...defaultRequire('./web.ts'),
      ]
    : []),

  ...(filesGlobs.node.length > 0
    ? [
        {
          files: filesGlobs.node,
          rules: {},
        },
        ...defaultRequire('./web.ts'),
        ...defaultRequire('./node.ts'),
      ]
    : []),

  ...(filesGlobs.shared.length > 0 ? [...defaultRequire('./common.ts')] : []),

  ...(filesGlobs.other.length > 0
    ? [
        {
          files: filesGlobs.other,
          ignores: [...filesGlobs.web, ...filesGlobs.node, ...filesGlobs.shared].filter(Boolean),
          rules: {},
        },
        ...defaultRequire('./common.ts'),
      ]
    : []),
];

export default config;

if (typeof module !== 'undefined') {
  module.exports = config;
}
