import fs from 'fs';
import paths from '../paths';

module.exports = {
  extends: [require.resolve('./node.eslintrc.js'), require.resolve('./ts.common.eslintrc.js')],

  parserOptions: {
    project: fs.existsSync(paths.server.tsconfig) ? paths.server.tsconfig : 'tsconfig.json',
  },
};
