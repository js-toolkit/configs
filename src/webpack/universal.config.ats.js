import webpackMerge from 'webpack-merge';
import path from 'path';
import paths from '../paths';
import universalConfig from './universal.config';
import { defaultRules } from './universal.config.ts';
import commonConfigTs from './common.config.ts';
import loaders from './loaders';

export { defaultRules };

export default ({
  entry,
  rules,
  tsconfigPath = path.join(paths.root, 'tsconfig.json'),
  nodeExternalsOptions,
}) => {
  const { tsRule, ...rest } = defaultRules;

  const useDefaultRules = {
    tsRule: {
      ...tsRule,
      use: loaders.ats({ tsconfig: tsconfigPath }),
    },
    ...rest,
  };

  // Merge and replace rules
  const moduleRules = webpackMerge.strategy(
    Object.getOwnPropertyNames(useDefaultRules).reduce(
      (obj, name) => ({ ...obj, [name]: 'replace' }),
      {}
    )
  )(useDefaultRules, rules);

  return webpackMerge(
    commonConfigTs(),
    universalConfig({ entry, rules: moduleRules, nodeExternalsOptions }),
    { plugins: [loaders.atsCheckerPlugin()] }
  );
};
