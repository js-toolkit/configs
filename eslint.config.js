import common from './src/eslint/common.ts';

export default [
  ...common,

  {
    rules: {
      'import-x/extensions': ['error', { ts: 'always' }],
      'import-x/no-import-module-exports': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      //     'no-undef': 'off',
      //     'no-unused-vars': 'off',
      //     'no-unused-expressions': ['error', { allowShortCircuit: true }],
      //     'no-use-before-define': 'off',
      //     'no-restricted-globals': 'off',
      //     'no-redeclare': 'off',
      //     'no-inner-declarations': ['off', 'functions'],
      //     'no-console': 'off',
      //     'class-methods-use-this': 'off',
      //     'global-require': 'off',
      //     '@typescript-eslint/no-var-requires': 'off',
      //     '@typescript-eslint/no-explicit-any': 'off',
      //     '@typescript-eslint/explicit-function-return-type': [
      //       'warn',
      //       { allowExpressions: true, allowTypedFunctionExpressions: true },
      //     ],
      //     '@typescript-eslint/no-unsafe-assignment': 'off',
      //     '@typescript-eslint/no-unsafe-return': 'off',
      //     '@typescript-eslint/no-unsafe-call': 'off',
      //     '@typescript-eslint/no-unsafe-member-access': 'off',
      //     '@typescript-eslint/explicit-module-boundary-types': 'off',
      //     '@typescript-eslint/prefer-nullish-coalescing': [
      //       'error',
      //       {
      //         ignorePrimitives: { string: true },
      //         ignoreMixedLogicalExpressions: true,
      //       },
      //     ],
      //     '@typescript-eslint/no-unnecessary-condition': [
      //       'error',
      //       { checkTypePredicates: true, allowConstantLoopConditions: 'only-allowed-literals' },
      //     ],
    },
  },
];
