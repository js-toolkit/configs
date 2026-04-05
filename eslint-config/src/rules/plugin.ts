import noNamespaceExceptDeclarationMergeRule from './no-namespace-except-declaration-merge.ts';
import noUnnecessaryOptionalChainRule from './no-unnecessary-optional-chain.ts';
import strictBooleanExpressionsRule from './strict-boolean-expressions.ts';

export const plugin = {
  rules: {
    'no-namespace-except-declaration-merge': noNamespaceExceptDeclarationMergeRule,
    'no-unnecessary-optional-chain': noUnnecessaryOptionalChainRule,
    'strict-boolean-expressions': strictBooleanExpressionsRule,
  },
};
