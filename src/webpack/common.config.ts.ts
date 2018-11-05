import { Configuration } from 'webpack';

export default (): Configuration => ({
  resolve: {
    // will be merged with extensions from common.config.js
    extensions: ['.ts', '.tsx', '.d.ts'],
  },
});
