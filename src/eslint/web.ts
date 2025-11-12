/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-require-imports */
import fs from 'fs';
import path from 'path';
import globals from 'globals';
import type { Linter } from 'eslint';
import { fixupConfigRules, type FixupConfigArray } from '@eslint/compat';
import buildConfig from '../buildConfig';
import paths, {
  getFilesGlob,
  getNonSXExtensions,
  getSXExtensions,
  getTSXExtensions,
} from '../paths';
import { getInstalledPackage } from '../getInstalledPackage';
import { eslintTsProject } from './consts';
import { compat } from './utils';

const webConfigEnabled = buildConfig.web && fs.existsSync(paths.web.root);

const hasReactPlugin = !!getInstalledPackage('eslint-plugin-react');
const hasReactA11yPlugin = !!getInstalledPackage('eslint-plugin-jsx-a11y');
const hasReactHooksPlugin = !!getInstalledPackage('eslint-plugin-react-hooks');
const hasWCPlugin = !!getInstalledPackage('eslint-plugin-wc');
const hasMobxPlugin = !!getInstalledPackage('eslint-plugin-mobx');
const hasConfigAirbnb = !!getInstalledPackage('eslint-config-airbnb');
const hasTypescriptEslintPlugin = !!getInstalledPackage('typescript-eslint');
const hasPrettierEslintPlugin = !!getInstalledPackage('eslint-plugin-prettier/recommended');

delete (globals.browser as any)['AudioWorkletGlobalScope '];

const filterAirbnbRules = (config: 'react' | 'react-a11y'): FixupConfigArray => {
  return fixupConfigRules({
    rules: require(
      require('eslint-config-airbnb').extends.find((url: string) => url.endsWith(`${config}.js`))
    ).rules,
  });
};

const config: Linter.Config[] = [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  ...[
    hasReactPlugin && require('eslint-plugin-react/configs/recommended'),
    ...(hasReactPlugin && hasConfigAirbnb ? filterAirbnbRules('react') : []),
    hasReactPlugin && require('eslint-plugin-react/configs/jsx-runtime'),
    hasReactPlugin && {
      // languageOptions: {
      //   parserOptions: {
      //     ecmaFeatures: {
      //       jsx: true,
      //     },
      //   },
      // },
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        // 'react/prop-types': 'off',
        // 'react/sort-comp': 'off',
        // 'react/display-name': 'off',
        // 'react/destructuring-assignment': ['error', 'always', { ignoreClassFields: true }],
        // 'react/jsx-filename-extension': ['error', { extensions: getSXExtensions() }],
        // 'react/jsx-wrap-multilines': 'off',
        'react/jsx-props-no-spreading': 'off',
        // 'react/jsx-indent': 'off',
        // 'react/function-component-definition': [
        //   'error',
        //   { namedComponents: 'function-declaration', unnamedComponents: 'arrow-function' },
        // ],
      },
    },
  ]
    .filter(Boolean)
    .map((conf) => ({
      ...conf,
      files: [...(conf.files ?? []), getFilesGlob(getSXExtensions())],
    })),

  ...(hasReactPlugin && hasTypescriptEslintPlugin
    ? [
        {
          files: [getFilesGlob(getTSXExtensions())],
          rules: {
            'react/jsx-filename-extension': ['error', { extensions: getSXExtensions() }],
            'react/require-default-props': 'off',
          },
        } satisfies Linter.Config,
      ]
    : []),

  ...[
    hasReactA11yPlugin && require('eslint-plugin-jsx-a11y').flatConfigs.recommended,
    ...(hasReactA11yPlugin && hasConfigAirbnb ? filterAirbnbRules('react-a11y') : []),
    hasReactA11yPlugin && {
      rules: {
        'jsx-a11y/anchor-is-valid': ['error', { specialLink: ['to'] }],
        'jsx-a11y/label-has-for': ['error', { allowChildren: true }],
      },
    },
  ]
    .filter(Boolean)
    .map((conf) => ({
      ...conf,
      files: [...(conf.files ?? []), getFilesGlob(getSXExtensions())],
    })),

  ...(hasReactHooksPlugin
    ? [
        require('eslint-plugin-react-hooks').configs.flat['recommended-latest'],
        { rules: { 'react-hooks/exhaustive-deps': 'error' } },
      ]
    : []),

  ...(hasWCPlugin
    ? [
        require('eslint-plugin-wc').configs['flat/best-practice'],
        {
          settings: {
            wc: {
              elementBaseClasses: ['HTMLElement'],
            },
          },
        },
      ]
    : []
  ).map((conf) => ({
    ...conf,
    files: [...(conf.files ?? []), getFilesGlob(getNonSXExtensions())],
  })),

  // Redefine again to override react rules.
  ...(hasPrettierEslintPlugin ? [require('eslint-plugin-prettier/recommended')] : []),

  ...(hasMobxPlugin
    ? [...compat.extends('plugin:mobx/recommended'), { rules: { 'mobx/missing-observer': 'off' } }]
    : []),

  ...(webConfigEnabled && hasTypescriptEslintPlugin
    ? (() => {
        let eslintTsConfig = path.join(paths.web.root, eslintTsProject);
        if (!fs.existsSync(eslintTsConfig)) {
          eslintTsConfig = paths.web.tsconfig;
        }
        if (!fs.existsSync(eslintTsConfig)) {
          eslintTsConfig = '';
        }
        if (!eslintTsConfig) {
          return [];
        }
        const tsconfig = path.resolve(eslintTsConfig);
        return [
          {
            files: [getFilesGlob(getTSXExtensions())],
            languageOptions: {
              parserOptions: {
                // project: tsconfig,
                projectService: {
                  defaultProject: tsconfig,
                },
              },
            },
          } satisfies Linter.Config,
        ];
      })()
    : []),
];

module.exports = config;
export default config;
