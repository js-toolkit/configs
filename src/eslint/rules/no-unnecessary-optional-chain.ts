import {
  AST_NODE_TYPES,
  AST_TOKEN_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';
import { isTypeFlagSet, unionConstituents } from 'ts-api-utils';
import * as ts from 'typescript';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/js-toolkit/configs/blob/main/src/eslint/rules/${name}.ts`
);

export interface Options {
  autofix?: boolean;
}

type MessageId = 'neverOptionalChain' | 'suggestRemoveOptionalChain';

// ─── Type helpers ────────────────────────────────────────────────────────────

function isNullishType(type: ts.Type): boolean {
  return (
    isTypeFlagSet(type, ts.TypeFlags.Null) ||
    isTypeFlagSet(type, ts.TypeFlags.Undefined) ||
    isTypeFlagSet(type, ts.TypeFlags.Void)
  );
}

function isNullableType(type: ts.Type): boolean {
  return unionConstituents(type).some(isNullishType);
}

/** Optional chain is always necessary for `any`, `unknown`, or naked type variables. */
function isAlwaysNecessary(type: ts.Type): boolean {
  return unionConstituents(type).some(
    (t) =>
      isTypeFlagSet(t, ts.TypeFlags.Any) ||
      isTypeFlagSet(t, ts.TypeFlags.Unknown) ||
      isTypeFlagSet(t, ts.TypeFlags.TypeVariable)
  );
}

// ─── Rule ────────────────────────────────────────────────────────────────────

export default createRule<[Options], MessageId>({
  name: 'no-unnecessary-optional-chain',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Disallow unnecessary optional chaining (`?.`) on non-nullish values.',
    },
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          autofix: {
            type: 'boolean',
            description: 'Automatically remove unnecessary optional chains via `--fix`.',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      neverOptionalChain: 'Unnecessary optional chain on a non-nullish value.',
      suggestRemoveOptionalChain: 'Remove unnecessary optional chain.',
    },
    defaultOptions: [{}],
  },

  create(context, [userOptions]) {
    const autofix = userOptions.autofix ?? true;
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    const compilerOptions = services.program.getCompilerOptions();
    const isNoUncheckedIndexedAccess = compilerOptions.noUncheckedIndexedAccess === true;

    function getConstrainedType(node: TSESTree.Node): ts.Type {
      const type = services.getTypeAtLocation(node);
      return checker.getBaseConstraintOfType(type) ?? type;
    }

    // ── Array / tuple helpers ────────────────────────────────────────────

    function isArrayOrTupleType(type: ts.Type): boolean {
      return unionConstituents(type).some((t) => checker.isArrayType(t) || checker.isTupleType(t));
    }

    function isArrayIndexExpression(node: TSESTree.Expression): boolean {
      if (node.type !== AST_NODE_TYPES.MemberExpression || !node.computed) return false;
      const objectType = getConstrainedType(node.object);
      if (!isArrayOrTupleType(objectType)) return false;
      return !(checker.isTupleType(objectType) && node.property.type === AST_NODE_TYPES.Literal);
    }

    /**
     * Recursively searches an optional chain for an array index expression.
     * An array index "infects" the rest of the chain because TS index
     * signatures don't represent out-of-bounds access.
     */
    function optionChainContainsArrayIndex(
      node: TSESTree.CallExpression | TSESTree.MemberExpression
    ): boolean {
      const lhs = node.type === AST_NODE_TYPES.CallExpression ? node.callee : node.object;
      if (
        node.optional &&
        lhs.type === AST_NODE_TYPES.MemberExpression &&
        isArrayIndexExpression(lhs)
      ) {
        return true;
      }
      if (
        lhs.type === AST_NODE_TYPES.MemberExpression ||
        lhs.type === AST_NODE_TYPES.CallExpression
      ) {
        return optionChainContainsArrayIndex(lhs);
      }
      return false;
    }

    // ── Nullable origin helpers ──────────────────────────────────────────

    function isNullablePropertyType(objType: ts.Type, propertyType: ts.Type): boolean {
      if (propertyType.isUnion()) {
        return propertyType.types.some((t) => isNullablePropertyType(objType, t));
      }
      if (propertyType.isNumberLiteral() || propertyType.isStringLiteral()) {
        const propSymbol = objType.getProperty(propertyType.value.toString());
        if (propSymbol) return isNullableType(checker.getTypeOfSymbol(propSymbol));
      }
      const typeName = checker.typeToString(propertyType);
      return checker
        .getIndexInfosOfType(objType)
        .some((info) => checker.typeToString(info.keyType) === typeName);
    }

    /**
     * Returns `true` when the member expression's nullability originates
     * from the object itself (e.g. `foo` in `foo?.bar` is `T | null`),
     * rather than from an own property being nullable.
     */
    function isMemberExpressionNullableOriginFromObject(node: TSESTree.MemberExpression): boolean {
      const objectType = getConstrainedType(node.object);
      if (!objectType.isUnion() || node.property.type !== AST_NODE_TYPES.Identifier) {
        return false;
      }

      const isOwnNullable = objectType.types.some((type) => {
        if (node.computed) {
          const propertyType = getConstrainedType(node.property);
          return isNullablePropertyType(type, propertyType);
        }
        const propSymbol = type.getProperty(node.property.name);
        if (propSymbol) return isNullableType(checker.getTypeOfSymbol(propSymbol));
        return checker
          .getIndexInfosOfType(type)
          .some(
            (info) =>
              checker.typeToString(info.keyType) === 'string' &&
              (isNoUncheckedIndexedAccess || isNullableType(info.type))
          );
      });

      return !isOwnNullable && isNullableType(objectType);
    }

    function isCallExpressionNullableOriginFromCallee(node: TSESTree.CallExpression): boolean {
      const calleeType = getConstrainedType(node.callee);
      if (!calleeType.isUnion()) return false;
      const isOwnNullable = calleeType.types.some((type) =>
        type.getCallSignatures().some((sig) => isNullableType(sig.getReturnType()))
      );
      return !isOwnNullable && isNullableType(calleeType);
    }

    // ── Core check ───────────────────────────────────────────────────────

    function isOptionableExpression(node: TSESTree.Expression): boolean {
      const type = getConstrainedType(node);

      let isOwnNullable = true;
      if (node.type === AST_NODE_TYPES.MemberExpression) {
        isOwnNullable = !isMemberExpressionNullableOriginFromObject(node);
      } else if (node.type === AST_NODE_TYPES.CallExpression) {
        isOwnNullable = !isCallExpressionNullableOriginFromCallee(node);
      }

      return isAlwaysNecessary(type) || (isOwnNullable && isNullableType(type));
    }

    function checkOptionalChain(
      node: TSESTree.CallExpression | TSESTree.MemberExpression,
      beforeOperator: TSESTree.Node,
      fix: '' | '.'
    ): void {
      if (!node.optional) return;
      if (!isNoUncheckedIndexedAccess && optionChainContainsArrayIndex(node)) return;

      const nodeToCheck = node.type === AST_NODE_TYPES.CallExpression ? node.callee : node.object;

      if (isOptionableExpression(nodeToCheck)) return;

      const questionDotOperator = context.sourceCode.getTokenAfter(
        beforeOperator,
        (token) => token.type === AST_TOKEN_TYPES.Punctuator && token.value === '?.'
      );
      if (!questionDotOperator) return;

      const applyFix = (fixer: TSESLint.RuleFixer): TSESLint.RuleFix =>
        fixer.replaceText(questionDotOperator, fix);

      context.report({
        loc: questionDotOperator.loc,
        node,
        messageId: 'neverOptionalChain',
        ...(autofix
          ? { fix: applyFix }
          : {
              suggest: [{ messageId: 'suggestRemoveOptionalChain' as const, fix: applyFix }],
            }),
      });
    }

    // ── Visitors ─────────────────────────────────────────────────────────

    return {
      'MemberExpression[optional = true]': function (node: TSESTree.MemberExpression) {
        checkOptionalChain(node, node.object, node.computed ? '' : '.');
      },
      'CallExpression[optional = true]': function (node: TSESTree.CallExpression) {
        checkOptionalChain(node, node.callee, '');
      },
    };
  },
});
