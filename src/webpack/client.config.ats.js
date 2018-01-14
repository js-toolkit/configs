import webpackMerge from 'webpack-merge';
import * as path from 'path';
import paths from '../paths';
import loaders from './loaders';
import clientConfig from './client.config';
import { defaultRules } from './client.config.ts';

export { defaultRules };

export default ({ entry, rules, tsconfigPath = path.join(paths.client.root, 'tsconfig.json') }) => {
  const { tsRule, ...rest } = defaultRules;

  const useDefaultRules = {
    tsRule: {
      ...tsRule,
      use: [loaders.ats({ tsconfig: tsconfigPath })],
    },
    ...rest,
  };

  // Merge and replace rules
  const moduleRules = webpackMerge.strategy(
    Object.getOwnPropertyNames(useDefaultRules).reduce(
      (obj, name) => ({
        ...obj,
        [name]: 'replace',
      }),
      {}
    )
  )(useDefaultRules, rules);

  return webpackMerge(clientConfig({ entry, rules: moduleRules }), {
    plugins: [loaders.atsCheckerPlugin()],
  });
};
