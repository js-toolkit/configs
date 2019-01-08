import { RuleSetRule } from 'webpack';
import webpackMerge from 'webpack-merge';

export type Rules = Record<string, RuleSetRule>;

/** Merge and replace rules */
export function mergeAndReplaceRules(defaultRules: Rules, rules: Rules): Rules {
  return webpackMerge.strategy(
    Object.getOwnPropertyNames(defaultRules).reduce(
      (obj, name) => ({ ...obj, [name]: 'replace' }),
      {}
    )
  )(defaultRules, rules) as Rules;
}
