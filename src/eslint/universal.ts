import fs from 'fs';
import type { Linter } from 'eslint';
import paths from '../paths.ts';
import buildConfig, { type BuildConfig } from '../buildConfig.ts';
import { getFilesGlob, moduleExtensions } from '../extensions.ts';
import { create as createCommon, type CreateOptions } from './common.ts';
import { create as createWeb } from './web.ts';

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

export function create(options: CreateOptions): Linter.Config[] {
  const webConfig = createWeb(options);
  const commonConfig = createCommon(options);

  return [
    {
      // Add to settings because we can export only valid configuration object without other named exports.
      settings: { filesGlobs, getFilesGlob },
    },

    ...(filesGlobs.web.length > 0
      ? commonConfig.map((conf) => ({
          ...conf,
          files: [...(conf.files ?? []), ...filesGlobs.web],
        }))
      : []),
    ...(filesGlobs.web.length > 0
      ? webConfig.map((conf) => ({
          ...conf,
          files: [...(conf.files ?? []), ...filesGlobs.web],
        }))
      : []),

    ...(filesGlobs.node.length > 0
      ? commonConfig.map((conf) => ({
          ...conf,
          files: [...(conf.files ?? []), ...filesGlobs.node],
        }))
      : []),
    ...(filesGlobs.node.length > 0
      ? webConfig.map((conf) => ({
          ...conf,
          files: [...(conf.files ?? []), ...filesGlobs.node],
        }))
      : []),

    ...(filesGlobs.shared.length > 0
      ? commonConfig.map((conf) => ({
          ...conf,
          files: [...(conf.files ?? []), ...filesGlobs.shared],
        }))
      : []),

    ...(filesGlobs.other.length > 0
      ? commonConfig.map((conf) => ({
          ...conf,
          files: [...(conf.files ?? []), ...filesGlobs.other],
          ignores: [
            ...(conf.ignores ?? []),
            ...filesGlobs.web,
            ...filesGlobs.node,
            ...filesGlobs.shared,
          ].filter(Boolean),
        }))
      : []),
  ];
}

const config: Linter.Config[] = create({ resolvePaths: import.meta.dirname });

export default config;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
  module.exports.create = create;
}
