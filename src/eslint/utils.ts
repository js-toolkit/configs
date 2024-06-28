import type { ESLint } from 'eslint';
import { FlatCompat } from '@eslint/eslintrc';
import { fixupPluginRules } from '@eslint/compat';

// https://eslint.org/docs/latest/use/configure/migration-guide#using-eslintrc-configs-in-flat-config
// https://github.com/eslint/eslintrc?tab=readme-ov-file#usage-esm
export const compat = new FlatCompat({
  // baseDirectory: __dirname,
  // recommendedConfig: eslintJs.configs.recommended,
});

export function legacyPlugin(name: string, alias = name): ESLint.Plugin {
  const plugin = compat.plugins(name)[0]?.plugins?.[alias];

  if (!plugin) {
    throw new Error(`Unable to resolve plugin ${name} and/or alias ${alias}`);
  }

  return fixupPluginRules(plugin);
}
