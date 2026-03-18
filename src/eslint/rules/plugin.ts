import noNamespaceExceptDeclarationMergeRule from './no-namespace-except-declaration-merge.ts';
import strictBooleanExpressionsRule from './strict-boolean-expressions.ts';

export const plugin = {
  rules: {
    'no-namespace-except-declaration-merge': noNamespaceExceptDeclarationMergeRule,
    'strict-boolean-expressions': strictBooleanExpressionsRule,
  },
};
