import webpackMerge from 'webpack-merge';
import { RuleSetRule } from 'webpack';
import loaders, { BaseTsOptions } from './loaders';

export interface GetTsRuleOptions extends BaseTsOptions {
  tsRule: RuleSetRule;
  rhl?: boolean;
}

export function getTsRule({ tsRule, rhl, tsconfig }: GetTsRuleOptions) {
  return {
    ...tsRule,
    use: (rhl ? loaders.tsRHL4 : loaders.ts)({ tsconfig, forkedChecks: true }),
  };
}

export function getAtsRule({ tsRule, rhl, tsconfig }: GetTsRuleOptions) {
  return {
    ...tsRule,
    use: rhl ? loaders.tsRHL4({ tsconfig }) : loaders.ats({ tsconfig }),
  };
}

/** Merge and replace rules */
export function mergeAndReplaceRules(
  defaultRules: Record<string, RuleSetRule>,
  rules: Record<string, RuleSetRule>
) {
  return webpackMerge.strategy(
    Object.getOwnPropertyNames(defaultRules).reduce(
      (obj, name) => ({ ...obj, [name]: 'replace' }),
      {}
    )
  )(defaultRules as any, rules as any) as Record<string, RuleSetRule>;
}
