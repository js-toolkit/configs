import commonJson from './common.eslintrc.json';
import { dirMap } from '../paths';

module.exports = {
  extends: ['./common.eslintrc.json'],

  settings: {
    ...commonJson.settings,

    'import/resolver': {
      ...commonJson.settings['import/resolver'],
      node: {
        ...commonJson.settings['import/resolver'].node,
        moduleDirectory: [
          'node_modules',
          dirMap.client.sources,
          dirMap.server.sources,
          dirMap.shared.sources,
        ],
      },
    },
  },

  // rules: {
  //   'import/extensions': [
  //     'error',
  //     'ignorePackages',
  //     { js: 'never', jsx: 'never', ts: 'never', tsx: 'never' },
  //   ],
  // },
};
