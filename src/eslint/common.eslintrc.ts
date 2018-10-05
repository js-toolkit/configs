import { dirMap } from '../paths';

module.exports = {
  extends: ['./common.eslintrc.json'],

  settings: {
    'import/resolver': {
      node: {
        moduleDirectory: [
          'node_modules',
          dirMap.client.sources,
          dirMap.server.sources,
          dirMap.shared.sources,
        ],
      },
    },
  },
};
