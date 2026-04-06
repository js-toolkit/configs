import globals from 'globals';
import type { Linter } from 'eslint';
import { fixupConfigRules, type FixupConfigArray } from '@eslint/compat';
import {
  getFilesGlob,
  getNonSXExtensions,
  getSXExtensions,
  getTSExtensions,
  getTSXExtensions,
} from '@js-toolkit/config-utils/extensions';
import { getProjectDependencies } from '@js-toolkit/config-utils/getProjectDependencies';
import { getInstalledPackage } from '@js-toolkit/config-utils/getInstalledPackage';
import { defaultRequire } from '@js-toolkit/config-utils/defaultRequire';
import { addFilesGlob } from './utils.ts';
import type { CreateOptions } from './common.ts';

const filterAirbnbRules = (config: 'react' | 'react-a11y'): FixupConfigArray => {
  return fixupConfigRules({
    rules: defaultRequire(
      defaultRequire('eslint-config-airbnb').extends.find((url: string) =>
        url.endsWith(`${config}.js`),
      ),
    ).rules,
  });
};

export function create({
  resolvePaths: resolvePaths0,
  depsOnly,
  replaceImportPlugin,
}: CreateOptions): Linter.Config[] {
  const resolvePaths = typeof resolvePaths0 === 'string' ? [resolvePaths0] : resolvePaths0;
  const deps = depsOnly && getProjectDependencies(resolvePaths);

  const hasDep = (name: string): boolean => {
    if (deps && !deps.has(name)) return false;
    return !!getInstalledPackage(name, { resolvePaths });
  };

  const hasReactPlugin = hasDep('eslint-plugin-react');
  const hasReactA11yPlugin = hasDep('eslint-plugin-jsx-a11y');
  const hasReactHooksPlugin = hasDep('eslint-plugin-react-hooks');
  const hasWCPlugin = hasDep('eslint-plugin-wc');
  const hasLitPlugin = hasDep('eslint-plugin-lit');
  const hasMobxPlugin = hasDep('eslint-plugin-mobx');
  const hasConfigAirbnb = hasDep('eslint-config-airbnb');
  const hasConfigNext = hasDep('eslint-config-next');
  const hasTypescriptPlugin = hasDep('typescript-eslint');
  const hasPrettierPlugin = hasDep('eslint-plugin-prettier');
  const hasImportXPlugin = hasDep('eslint-plugin-import-x');

  const replaceNextConfig = (): Linter.Config[] => {
    const configs = defaultRequire('eslint-config-next/core-web-vitals') as Linter.Config[];

    configs.forEach((config) => {
      if (hasReactPlugin) delete config.plugins?.react;
      if (hasReactHooksPlugin) delete config.plugins?.['react-hooks'];
      if (hasReactA11yPlugin) delete config.plugins?.['jsx-a11y'];

      if (replaceImportPlugin && hasImportXPlugin) {
        delete config.plugins?.import;
        delete config.settings?.['import/parsers'];
        if (config.rules) {
          config.rules = Object.entries(config.rules).reduce<Linter.RulesRecord>(
            (acc, [name, value]) => {
              if (value != null) acc[name.replace('import/', 'import-x/')] = value;
              return acc;
            },
            {},
          );
        }
      }
    });

    return configs;
  };

  return [
    ...(hasReactPlugin
      ? (() => {
          const plugin = defaultRequire('eslint-plugin-react');
          return [
            plugin.configs.flat.recommended as Linter.Config,
            ...(hasConfigAirbnb ? filterAirbnbRules('react') : []),
            plugin.configs.flat['jsx-runtime'] as Linter.Config,
            {
              languageOptions: {
                ...plugin.configs.flat.recommended.languageOptions,
                globals: {
                  ...globals.browser,
                },
              },
              settings: {
                react: {
                  version: 'detect',
                },
              },
              rules: {
                'react/jsx-props-no-spreading': 'off',
                'react/function-component-definition': [
                  'error',
                  {
                    namedComponents: 'function-declaration',
                    unnamedComponents: ['arrow-function', 'function-expression'],
                  },
                ],
              },
            } satisfies Linter.Config as Linter.Config,
          ];
        })()
      : [
          {
            languageOptions: {
              globals: {
                ...globals.browser,
              },
            },
          } satisfies Linter.Config as Linter.Config,
        ]
    ).map((conf) => addFilesGlob(conf, getFilesGlob(getSXExtensions()))),

    ...(hasReactA11yPlugin
      ? (() => {
          const plugin = defaultRequire('eslint-plugin-jsx-a11y');
          return [
            plugin.flatConfigs.recommended as Linter.Config,
            ...(hasConfigAirbnb ? filterAirbnbRules('react-a11y') : []),
            {
              rules: {
                'jsx-a11y/anchor-is-valid': ['error', { specialLink: ['to'] }],
                'jsx-a11y/label-has-for': ['error', { allowChildren: true }],
              },
            } satisfies Linter.Config as Linter.Config,
          ];
        })()
      : []
    ).map((conf) => addFilesGlob(conf, getFilesGlob(getSXExtensions()))),

    ...(hasReactPlugin && hasTypescriptPlugin
      ? [
          {
            files: [getFilesGlob(getTSXExtensions())],
            rules: {
              'react/jsx-filename-extension': [
                'error',
                { allow: 'as-needed', extensions: getSXExtensions() },
              ],
              'react/require-default-props': 'off',
            },
          } satisfies Linter.Config as Linter.Config,
        ]
      : []),

    ...(hasReactHooksPlugin
      ? [
          defaultRequire('eslint-plugin-react-hooks').configs.flat[
            'recommended-latest'
          ] as Linter.Config,
          {
            rules: { 'react-hooks/exhaustive-deps': 'error' },
          } satisfies Linter.Config as Linter.Config,
        ]
      : []),

    ...(hasConfigNext ? replaceNextConfig() : []),
    ...(hasConfigNext && hasTypescriptPlugin
      ? (defaultRequire('eslint-config-next/typescript') as Linter.Config[]).map((conf) =>
          addFilesGlob(conf, getFilesGlob(getTSExtensions())),
        )
      : []),

    ...[
      hasWCPlugin &&
        (defaultRequire('eslint-plugin-wc').configs['flat/best-practice'] as Linter.Config),
      hasWCPlugin &&
        ({
          settings: {
            wc: {
              elementBaseClasses: ['HTMLElement'],
            },
          },
        } satisfies Linter.Config as Linter.Config),
      hasLitPlugin &&
        (defaultRequire('eslint-plugin-lit').configs['flat/recommended'] as Linter.Config),
      hasLitPlugin &&
        ({
          settings: {
            lit: {
              elementBaseClasses: ['LitElement'],
            },
          },
        } satisfies Linter.Config as Linter.Config),
    ]
      .filter((conf): conf is Linter.Config => !!conf)
      .map((conf) => addFilesGlob(conf, getFilesGlob(getNonSXExtensions()))),

    ...(hasPrettierPlugin ? [defaultRequire('eslint-plugin-prettier/recommended')] : []),

    ...(hasMobxPlugin ? [defaultRequire('eslint-plugin-mobx').flatConfigs.recommended] : []),
  ];
}

const config: Linter.Config[] = create({ resolvePaths: process.cwd(), replaceImportPlugin: true });

export default config;
