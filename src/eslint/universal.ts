import fs from 'fs';
import path from 'path';
import type { Linter } from 'eslint';
import buildConfig, { BuildConfig } from '../buildConfig';
import paths, { moduleExtensions } from '../paths';
import { eslintTsProject } from './consts';

function getFilesGlob(basePath: string): string[] {
  return moduleExtensions.map((e) => `${basePath || '.'}/**/*${e}`);
}

const filesGlobs: Record<
  keyof Pick<BuildConfig, 'client' | 'server' | 'shared'> | 'other',
  string[]
> = {
  client:
    buildConfig.client && buildConfig.client.root && fs.existsSync(buildConfig.client.root)
      ? getFilesGlob(buildConfig.client.root)
      : [],
  server:
    buildConfig.server && buildConfig.server.root && fs.existsSync(buildConfig.server.root)
      ? getFilesGlob(buildConfig.server.root)
      : [],
  shared:
    buildConfig.shared && buildConfig.shared.root && fs.existsSync(buildConfig.shared.root)
      ? getFilesGlob(buildConfig.shared.root)
      : [],
  other: moduleExtensions.map((ext) => `*${ext}`),
};

const config: Linter.Config = {
  // Add to settings because we can export only valid configuration object without other named exports.
  settings: { filesGlobs, getFilesGlob },

  overrides: [
    ...(filesGlobs.client.length > 0
      ? [
          {
            files: filesGlobs.client,
            extends: [require.resolve('./react')],
            rules: {},
          },
        ]
      : []),

    ...(filesGlobs.server.length > 0
      ? [
          {
            files: filesGlobs.server,
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
                const config = path.join(paths.shared.root, eslintTsProject);
                if (fs.existsSync(config)) return config;
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
      excludedFiles: [...filesGlobs.client, ...filesGlobs.server, ...filesGlobs.shared].filter(
        (v) => !!v
      ),
      extends: [require.resolve('./common')],
      rules: {},
    },
  ],
};

module.exports = config;
