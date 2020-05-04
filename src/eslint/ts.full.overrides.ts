/**
 * Because files glob in `overrides` relative to the config file in which them declares
 * we can't provide complete eslint configuration and then extends it, so we just provide utils.
 * https://github.com/eslint/eslint/issues/11934#issuecomment-508024268
 */
import fs from 'fs';
import path from 'path';
import { Linter } from 'eslint';
import apprc, { AppRC } from '../apprc';
import paths, { moduleExtensions } from '../paths';
import { eslintTsProject } from './consts';

export function getTsFilesGlob(root: string): string[] {
  return moduleExtensions.filter((e) => e.includes('ts')).map((e) => `${root}/**/*${e}`);
}

export const filesGlobs: Record<
  keyof Pick<AppRC, 'client' | 'server' | 'shared'> | 'js',
  string[]
> = {
  client: getTsFilesGlob(apprc.client.root),
  server: getTsFilesGlob(apprc.server.root),
  shared: getTsFilesGlob(apprc.shared.root),
  js: moduleExtensions.filter((e) => e.includes('js')).map((e) => `**/*${e}`),
};

export function getOverrides(
  overrides: Partial<Record<keyof typeof filesGlobs | 'common', Linter.ConfigOverride>> = {}
): Linter.ConfigOverride[] {
  return [
    // ...apprc.client.map((config) => ({
    //   files: getTsFilesGlob(config.root),
    //   extends: [require.resolve('@vzh/configs/eslint/ts.react.eslintrc.js')],
    //   ...overrides.client,
    // })),
    {
      files: filesGlobs.client,
      extends: [require.resolve('@vzh/configs/eslint/ts.react.eslintrc.js')],
      ...overrides.client,
      rules: { ...overrides.common?.rules, ...overrides.client?.rules },
    },
    {
      files: filesGlobs.server,
      extends: [
        require.resolve('@vzh/configs/eslint/ts.react.eslintrc.js'),
        require.resolve('@vzh/configs/eslint/ts.node.eslintrc.js'),
      ],
      ...overrides.server,
      rules: { ...overrides.common?.rules, ...overrides.server?.rules },
    },
    {
      files: filesGlobs.shared,
      extends: [require.resolve('@vzh/configs/eslint/ts.common.eslintrc.js')],
      ...overrides.shared,
      rules: { ...overrides.common?.rules, ...overrides.shared?.rules },
      parserOptions: {
        project: (() => {
          if (fs.existsSync(path.join(paths.shared.root, eslintTsProject)))
            return path.join(paths.shared.root, eslintTsProject);
          if (fs.existsSync(paths.shared.tsconfig)) return paths.shared.tsconfig;
          return fs.existsSync(eslintTsProject) ? eslintTsProject : 'tsconfig.json';
        })(),
        ...(overrides.shared && overrides.shared.parserOptions),
      },
    },
    {
      files: filesGlobs.js,
      extends: [require.resolve('@vzh/configs/eslint/common.eslintrc.js')],
      ...overrides.js,
      rules: { ...overrides.common?.rules, ...overrides.js?.rules },
    },
  ];
}
