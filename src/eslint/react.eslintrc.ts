import { moduleFileExtensions } from '../paths';

module.exports = {
  extends: ['airbnb', require.resolve('./common.eslintrc.js')],

  env: {
    browser: true,
  },

  rules: {
    'react/sort-comp': 'off',
    'react/destructuring-assignment': ['on', 'always', { ignoreClassFields: true }],
    'react/jsx-filename-extension': [
      'error',
      { extensions: moduleFileExtensions.filter(ext => ext.includes('js')) },
    ],
    'jsx-a11y/anchor-is-valid': ['error', { specialLink: ['to'] }],
    'jsx-a11y/label-has-for': [2, { allowChildren: true }],
  },
};
