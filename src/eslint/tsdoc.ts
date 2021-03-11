import { moduleExtensions } from '../paths';

const config: import('eslint').Linter.Config = {
  overrides: [
    {
      files: moduleExtensions.filter((ext) => ext.includes('ts')).map((ext) => `*${ext}`),
      plugins: ['eslint-plugin-tsdoc'],
      rules: {
        'tsdoc/syntax': 'warn',
      },
    },
  ],
};

module.exports = config;
