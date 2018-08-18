import webpackMerge from 'webpack-merge';
import loaders from './loaders';

export function getTsRule({ tsRule, rhl, tsconfig } = {}) {
  return {
    ...tsRule,
    use: (rhl ? loaders.tsRHL4 : loaders.ts)({ tsconfig, forkedChecks: true }),
  };
}

export function getAtsRule({ tsRule, rhl, tsconfig } = {}) {
  return {
    ...tsRule,
    use: (rhl ? loaders.tsRHL4 : loaders.ats)({ tsconfig }),
  };
}

/** Merge and replace rules */
export function mergeAndReplaceRules(defaultRules, rules) {
  return webpackMerge.strategy(
    Object.getOwnPropertyNames(defaultRules).reduce(
      (obj, name) => ({ ...obj, [name]: 'replace' }),
      {}
    )
  )(defaultRules, rules);
}
