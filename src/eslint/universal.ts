import fs from 'fs';
import path from 'path';
import { Linter } from 'eslint';
import apprc, { AppRC } from '../apprc';
import paths, { moduleExtensions } from '../paths';
import { eslintTsProject } from './consts';

function getFilesGlob(basePath: string): string[] {
  return moduleExtensions.map((e) => `${basePath}/**/*${e}`);
}

const filesGlobs: Record<keyof Pick<AppRC, 'client' | 'server' | 'shared'> | 'other', string[]> = {
  client: getFilesGlob(apprc.client.root),
  server: getFilesGlob(apprc.server.root),
  shared: getFilesGlob(apprc.shared.root),
  other: moduleExtensions.map((ext) => `*${ext}`),
};

const config: Linter.Config = {
  // Add to settings because we can export only valid configuration object without other named exports.
  settings: { filesGlobs, getFilesGlob },

  overrides: [
    {
      files: filesGlobs.client,
      extends: [require.resolve('./react')],
      rules: {},
    },

    {
      files: filesGlobs.server,
      extends: [require.resolve('./react'), require.resolve('./node')],
      rules: {},
    },

    {
      files: filesGlobs.shared,
      extends: [require.resolve('./common')],
      env: {
        'shared-node-browser': true,
      },
      parserOptions: {
        project: (() => {
          if (fs.existsSync(path.join(paths.shared.root, eslintTsProject)))
            return path.join(paths.shared.root, eslintTsProject);
          if (fs.existsSync(paths.shared.tsconfig)) return paths.shared.tsconfig;
          return fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json';
        })(),
      },
      rules: {},
    },

    {
      files: filesGlobs.other,
      excludedFiles: [...filesGlobs.client, ...filesGlobs.server, ...filesGlobs.shared],
      extends: [require.resolve('./common')],
      rules: {},
    },
  ],
};

module.exports = config;
