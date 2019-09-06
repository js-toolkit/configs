/**
 * Because files glob in overrides relative from the config file it can't provides complete
 * eslint configuration and then extends it, so we just provide utils.
 * https://github.com/eslint/eslint/issues/11934#issuecomment-508024268
 */
import { Linter } from 'eslint';
import appConfig, { AppConfig } from '../appConfig';
import paths, { moduleExtensions } from '../paths';

export function getTsFilesGlob(root: string): string[] {
  return moduleExtensions.filter(e => e.includes('ts')).map(e => `${root}/**/*${e}`);
}

export const filesGlobs: Record<
  keyof Pick<AppConfig, 'client' | 'server' | 'shared'> | 'js',
  string[]
> = {
  client: getTsFilesGlob(appConfig.client.root),
  server: getTsFilesGlob(appConfig.server.root),
  shared: getTsFilesGlob(appConfig.shared.root),
  js: moduleExtensions.filter(e => e.includes('js')).map(e => `**/*${e}`),
};

export interface OverrideConfig extends Linter.RuleOverride, Omit<Linter.Config, 'overrides'> {}

export function getOverrides(
  overrides: Partial<Record<keyof typeof filesGlobs, OverrideConfig>> = {}
): OverrideConfig[] {
  return [
    {
      files: filesGlobs.client,
      extends: [require.resolve('@vzh/configs/eslint/ts.react.eslintrc.js')],
      ...overrides.client,
    },
    {
      files: filesGlobs.server,
      extends: [
        require.resolve('@vzh/configs/eslint/ts.react.eslintrc.js'),
        require.resolve('@vzh/configs/eslint/ts.node.eslintrc.js'),
      ],
      ...overrides.server,
    },
    {
      files: filesGlobs.shared,
      extends: [require.resolve('@vzh/configs/eslint/ts.common.eslintrc.js')],
      ...overrides.shared,
      parserOptions: {
        project: paths.shared.tsconfig,
        ...(overrides.shared && overrides.shared.parserOptions),
      },
    },
    {
      files: filesGlobs.js,
      extends: [require.resolve('@vzh/configs/eslint/common.eslintrc.js')],
      ...overrides.js,
    },
  ];
}
