import webpackMerge from 'webpack-merge';
import * as path from 'path';
import paths from '../paths';
import clientConfig from './client.config';
import loaders from './loaders';

const defaultRules = {
  tsRule: {
    test: /\.tsx?$/,
    include: [paths.client.sources, paths.shared.sources],
    use: loaders.ats({ tsconfig: tsconfigPath }),
  },
};

export default ({ entry, rules, tsconfigPath = path.join(paths.client.root, 'tsconfig.json') }) => {
  // Merge and replace rules
  const moduleRules = webpackMerge.strategy(
    Object.getOwnPropertyNames(defaultRules).reduce((obj, name) => ({ ...obj, [name]: 'replace' }))
  )(defaultRules, rules);

  return webpackMerge(clientConfig({ entry, rules: moduleRules }), {
    plugins: [loaders.atsCheckerPlugin()],
  });
};
