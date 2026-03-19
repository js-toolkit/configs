/* eslint-disable no-bitwise */
import { AST_NODE_TYPES, ESLintUtils, type TSESLint, TSESTree } from '@typescript-eslint/utils';
import * as ts from 'typescript';

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageId =
  | 'conditionErrorOther'
  | 'conditionErrorAny'
  | 'conditionErrorNullableBoolean'
  | 'conditionErrorNullableEnum'
  | 'conditionErrorNullableNumber'
  | 'conditionErrorNullableObject'
  | 'conditionErrorNullableString'
  | 'conditionErrorNullish'
  | 'conditionErrorNumber'
  | 'conditionErrorObject'
  | 'conditionErrorString'
  | 'conditionAlwaysTruthy'
  | 'conditionAlwaysFalsy'
  | 'noStrictNullCheck'
  | 'fixCastBoolean'
  | 'fixCompareTrue'
  | 'fixCompareNullish'
  | 'fixCompareEmptyString'
  | 'fixCompareFalse'
  | 'fixCompareZero'
  | 'fixCompareNaN'
  | 'fixCompareStringLength'
  | 'fixDefaultFalse'
  | 'fixDefaultEmptyString'
  | 'fixDefaultZero';

export interface Options {
  allowString?: boolean;
  allowNumber?: boolean;
  allowNullableObject?: boolean;
  allowNullableBoolean?: boolean;
  allowNullableString?: boolean;
  allowNullableNumber?: boolean;
  allowNullableEnum?: boolean;
  allowAny?: boolean;
  allowUnknown?: boolean;
  allowNever?: boolean;
  allowNonBooleanExpressions?: boolean;
}

type TypeKind =
  | 'never'
  | 'boolean'
  | 'truthyBooleanLiteral'
  | 'falsyBooleanLiteral'
  | 'nullableBoolean'
  | 'string'
  | 'nullableString'
  | 'number'
  | 'nullableNumber'
  | 'object'
  | 'nullableObject'
  | 'nullish'
  | 'enum'
  | 'nullableEnum'
  | 'any'
  | 'unknown';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/js-toolkit/configs/blob/main/src/eslint/rules/${name}.ts`
);

const ARRAY_PREDICATE_METHODS = new Set(['filter', 'find', 'findIndex', 'some', 'every']);

/**
 * Resolves type parameter constraints and recursively flattens unions to leaves.
 */
function resolveAndFlatten(type: ts.Type, checker: ts.TypeChecker): ts.Type[] {
  if (type.isUnion()) {
    return type.types.flatMap((t) => resolveAndFlatten(t, checker));
  }
  if ((type.flags & ts.TypeFlags.TypeParameter) !== 0) {
    const resolved = checker.getBaseConstraintOfType(type);
    if (resolved && resolved !== type) {
      return resolveAndFlatten(resolved, checker);
    }
  }
  return [type];
}

function isNullOrUndefined(type: ts.Type): boolean {
  return (type.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void)) !== 0;
}

function isBooleanLiteral(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.BooleanLiteral) !== 0;
}

function isBoolean(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.BooleanLike) !== 0;
}

function isString(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.StringLike) !== 0;
}

function isNumber(type: ts.Type): boolean {
  return (type.flags & (ts.TypeFlags.NumberLike | ts.TypeFlags.BigIntLike)) !== 0;
}

function isAny(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.Any) !== 0;
}

function isUnknown(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.Unknown) !== 0;
}

function isNever(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.Never) !== 0;
}

function isTypeParameter(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.TypeParameter) !== 0;
}

function isEnumType(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.EnumLike) !== 0;
}

// function isObjectLike(type: ts.Type): boolean {
//   return !!(
//     type.flags & ts.TypeFlags.Object ||
//     type.flags & ts.TypeFlags.NonPrimitive ||
//     type.flags & ts.TypeFlags.ESSymbol ||
//     type.flags & ts.TypeFlags.UniqueESSymbol
//   );
// }

function isTrueLiteral(type: ts.Type): boolean {
  return (
    isBooleanLiteral(type) &&
    (type as unknown as { intrinsicName: string }).intrinsicName === 'true'
  );
}

function isFalseLiteral(type: ts.Type): boolean {
  return (
    isBooleanLiteral(type) &&
    (type as unknown as { intrinsicName: string }).intrinsicName === 'false'
  );
}

function isBrandedBoolean(type: ts.Type): boolean {
  return (
    type.isIntersection() && type.types.some((t) => (t.flags & ts.TypeFlags.BooleanLike) !== 0)
  );
}

function isTruthyStringLiteral(type: ts.Type): boolean {
  return type.isStringLiteral() && type.value !== '';
}

function isTruthyNumberLiteral(type: ts.Type): boolean {
  return type.isNumberLiteral() && type.value !== 0;
}

function isStrictNullChecksEnabled(compilerOptions: ts.CompilerOptions): boolean {
  if (compilerOptions.strictNullChecks !== undefined) return compilerOptions.strictNullChecks;
  return compilerOptions.strict === true;
}

function isArrayLikeType(type: ts.Type, checker: ts.TypeChecker): boolean {
  if (checker.isArrayType(type) || checker.isTupleType(type)) return true;
  if (type.isUnion()) return type.types.every((t) => isArrayLikeType(t, checker));
  return false;
}

/**
 * Returns true if the classified result type contains only non-boolean value types
 * (object, string, number, enum) optionally mixed with nullish — and NO boolean.
 * Used to detect value-producing logical chains like `(a && <X />) || null`.
 */
function isNonBooleanValueType(kinds: Set<TypeKind>): boolean {
  let hasValue = false;
  for (const kind of kinds) {
    if (
      kind === 'boolean' ||
      kind === 'nullableBoolean' ||
      kind === 'truthyBooleanLiteral' ||
      kind === 'falsyBooleanLiteral'
    ) {
      return false;
    }
    switch (kind) {
      case 'object':
      case 'nullableObject':
      case 'string':
      case 'nullableString':
      case 'number':
      case 'nullableNumber':
      case 'enum':
      case 'nullableEnum':
        hasValue = true;
        break;
      default:
        break;
    }
  }
  return hasValue;
}

function needsWrapping(node: TSESTree.Expression): boolean {
  return (
    node.type === AST_NODE_TYPES.AssignmentExpression ||
    node.type === AST_NODE_TYPES.SequenceExpression ||
    node.type === AST_NODE_TYPES.ConditionalExpression ||
    node.type === AST_NODE_TYPES.YieldExpression ||
    node.type === AST_NODE_TYPES.BinaryExpression
  );
}

// ─── Classification ───────────────────────────────────────────────────────────

/**
 * Classifies the type of an expression as a set of TypeKind values.
 *
 * 1. Resolves type parameter constraints and flattens unions to leaves.
 * 2. null/undefined/void are nullable markers that make sibling types nullable.
 * 3. For boolean/string/number, detects truthy/falsy literals:
 *    - `true` → truthyBooleanLiteral (always truthy)
 *    - `false` → falsyBooleanLiteral (always falsy)
 *    - `true | null` → nullableBoolean (controlled by allowNullableBoolean)
 *    - `"hello" | null` → controlled by allowString (not allowNullableString)
 *    - `42 | null` → controlled by allowNumber (not allowNullableNumber)
 * 4. Branded booleans (`boolean & { __brand }`) are treated as boolean.
 * 5. Unresolved type parameters are classified as 'any'.
 */
function classifyType(type: ts.Type, checker: ts.TypeChecker): Set<TypeKind> {
  const leaves = resolveAndFlatten(type, checker);
  const hasNullish = leaves.some(isNullOrUndefined);

  const kinds = new Set<TypeKind>();

  const booleanLeaves: ts.Type[] = [];
  const stringLeaves: ts.Type[] = [];
  const numberLeaves: ts.Type[] = [];
  let hasObject = false;

  for (const leaf of leaves) {
    if (isNullOrUndefined(leaf)) {
      // handled via hasNullish
    } else if (isAny(leaf) || isTypeParameter(leaf)) {
      kinds.add('any');
    } else if (isUnknown(leaf)) {
      kinds.add('unknown');
    } else if (isNever(leaf)) {
      kinds.add('never');
    } else if (isBrandedBoolean(leaf)) {
      booleanLeaves.push(leaf);
    } else if (isBoolean(leaf)) {
      booleanLeaves.push(leaf);
    } else if (isEnumType(leaf)) {
      kinds.add(hasNullish ? 'nullableEnum' : 'enum');
    } else if (isString(leaf)) {
      stringLeaves.push(leaf);
    } else if (isNumber(leaf)) {
      numberLeaves.push(leaf);
      // } else if (isObjectLike(leaf)) {
      //   hasObject = true;
    } else {
      hasObject = true;
    }
  }

  if (booleanLeaves.length > 0) {
    const allTruthy = booleanLeaves.every(isTrueLiteral);
    const allFalsy = booleanLeaves.every(isFalseLiteral);

    if (allTruthy) {
      kinds.add(hasNullish ? 'nullableBoolean' : 'truthyBooleanLiteral');
    } else if (allFalsy) {
      kinds.add(hasNullish ? 'nullableBoolean' : 'falsyBooleanLiteral');
    } else {
      kinds.add(hasNullish ? 'nullableBoolean' : 'boolean');
    }
  }

  if (stringLeaves.length > 0) {
    const allTruthy = stringLeaves.every(isTruthyStringLiteral);
    if (allTruthy && hasNullish) {
      kinds.add('string');
    } else {
      kinds.add(hasNullish ? 'nullableString' : 'string');
    }
  }

  if (numberLeaves.length > 0) {
    const allTruthy = numberLeaves.every(isTruthyNumberLiteral);
    if (allTruthy && hasNullish) {
      kinds.add('number');
    } else {
      kinds.add(hasNullish ? 'nullableNumber' : 'number');
    }
  }

  if (hasObject) {
    kinds.add(hasNullish ? 'nullableObject' : 'object');
  }

  if (hasNullish && kinds.size === 0) {
    kinds.add('nullish');
  }

  return kinds;
}

// ─── Violation ────────────────────────────────────────────────────────────────

function getViolation(kinds: Set<TypeKind>, options: Required<Options>): MessageId | null {
  if (kinds.size === 0) {
    if (!options.allowNever) return 'conditionErrorOther';
    return null;
  }

  let hasAlwaysTruthy = false;
  let hasAlwaysFalsy = false;
  let hasOther = false;

  for (const kind of kinds) {
    switch (kind) {
      case 'never':
        if (!options.allowNever) return 'conditionErrorOther';
        break;

      case 'boolean':
        hasOther = true;
        break;

      case 'truthyBooleanLiteral':
      case 'object':
        hasAlwaysTruthy = true;
        break;

      case 'falsyBooleanLiteral':
      case 'nullish':
        hasAlwaysFalsy = true;
        break;

      case 'nullableBoolean':
        if (!options.allowNullableBoolean) return 'conditionErrorNullableBoolean';
        hasOther = true;
        break;

      case 'string':
        if (!options.allowString) return 'conditionErrorString';
        hasOther = true;
        break;

      case 'nullableString':
        if (!options.allowNullableString) return 'conditionErrorNullableString';
        hasOther = true;
        break;

      case 'number':
        if (!options.allowNumber) return 'conditionErrorNumber';
        hasOther = true;
        break;

      case 'nullableNumber':
        if (!options.allowNullableNumber) return 'conditionErrorNullableNumber';
        hasOther = true;
        break;

      case 'nullableObject':
        if (!options.allowNullableObject) return 'conditionErrorNullableObject';
        hasOther = true;
        break;

      case 'enum':
      case 'nullableEnum':
        if (!options.allowNullableEnum) return 'conditionErrorNullableEnum';
        hasOther = true;
        break;

      case 'any':
        if (!options.allowAny) return 'conditionErrorAny';
        hasOther = true;
        break;

      case 'unknown':
        if (!options.allowUnknown) return 'conditionErrorOther';
        hasOther = true;
        break;

      default:
        break;
    }
  }

  if (!hasOther) {
    if (hasAlwaysTruthy && !hasAlwaysFalsy) return 'conditionAlwaysTruthy';
    if (hasAlwaysFalsy && !hasAlwaysTruthy) return 'conditionAlwaysFalsy';
  }

  return null;
}

// ─── Rule ─────────────────────────────────────────────────────────────────────

export const rule = createRule<[Options], MessageId>({
  name: 'strict-boolean-expressions',
  meta: {
    type: 'suggestion',
    hasSuggestions: true,
    docs: {
      description: 'Disallow certain types in boolean expressions.',
    },
    messages: {
      conditionErrorOther: 'Unexpected value in {{context}}. A boolean expression is required.',
      conditionErrorAny:
        'Unexpected any value in {{context}}. ' +
        'An explicit comparison or type conversion is required.',
      conditionErrorNullableBoolean:
        'Unexpected nullable boolean value in {{context}}. ' +
        'Please handle the nullish case explicitly.',
      conditionErrorNullableEnum:
        'Unexpected nullable enum value in {{context}}. ' +
        'Please handle the nullish/zero/NaN cases explicitly.',
      conditionErrorNullableNumber:
        'Unexpected nullable number value in {{context}}. ' +
        'Please handle the nullish/zero/NaN cases explicitly.',
      conditionErrorNullableObject:
        'Unexpected nullable object value in {{context}}. An explicit null check is required.',
      conditionErrorNullableString:
        'Unexpected nullable string value in {{context}}. ' +
        'Please handle the nullish/empty cases explicitly.',
      conditionErrorNullish:
        'Unexpected nullish value in {{context}}. The condition is always false.',
      conditionErrorNumber:
        'Unexpected number value in {{context}}. An explicit zero/NaN check is required.',
      conditionErrorObject: 'Unexpected object value in {{context}}. The condition is always true.',
      conditionAlwaysTruthy: 'Unexpected value in {{context}}. The condition is always true.',
      conditionAlwaysFalsy: 'Unexpected value in {{context}}. The condition is always false.',
      conditionErrorString:
        'Unexpected string value in {{context}}. An explicit empty string check is required.',
      noStrictNullCheck:
        'This rule requires the `strictNullChecks` compiler option to be turned on to function correctly.',
      fixCastBoolean: 'Cast the expression to `boolean` (`Boolean(value)`).',
      fixCompareTrue: 'Change the condition to check for true (`value === true`).',
      fixCompareNullish: 'Change the condition to check for null/undefined (`value != null`).',
      fixCompareEmptyString: 'Change the condition to check for empty string (`value !== ""`).',
      fixCompareZero: 'Change the condition to check for zero (`value !== 0`).',
      fixCompareFalse: 'Change the condition to check for false (`value === false`).',
      fixCompareNaN: 'Change the condition to check for NaN (`!Number.isNaN(value)`).',
      fixCompareStringLength:
        "Change the condition to check the string's length (`value.length > 0`).",
      fixDefaultFalse: 'Provide a default of `false` for the condition (`value ?? false`).',
      fixDefaultEmptyString: 'Provide a default of `""` for the condition (`value ?? ""`).',
      fixDefaultZero: 'Provide a default of `0` for the condition (`value ?? 0`).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowString: { type: 'boolean' },
          allowNumber: { type: 'boolean' },
          allowNullableObject: { type: 'boolean' },
          allowNullableBoolean: { type: 'boolean' },
          allowNullableString: { type: 'boolean' },
          allowNullableNumber: { type: 'boolean' },
          allowNullableEnum: { type: 'boolean' },
          allowAny: { type: 'boolean' },
          allowUnknown: { type: 'boolean' },
          allowNever: { type: 'boolean' },
          allowNonBooleanExpressions: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{}],
  },

  create(context, [userOptions]) {
    const options: Required<Options> = {
      allowString: userOptions.allowString ?? false,
      allowNumber: userOptions.allowNumber ?? false,
      allowNullableObject: userOptions.allowNullableObject ?? false,
      allowNullableBoolean: userOptions.allowNullableBoolean ?? false,
      allowNullableString: userOptions.allowNullableString ?? false,
      allowNullableNumber: userOptions.allowNullableNumber ?? false,
      allowNullableEnum: userOptions.allowNullableEnum ?? false,
      allowAny: userOptions.allowAny ?? false,
      allowUnknown: userOptions.allowUnknown ?? false,
      allowNever: userOptions.allowNever ?? false,
      allowNonBooleanExpressions: userOptions.allowNonBooleanExpressions ?? false,
    };

    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    const { sourceCode } = context;

    if (!isStrictNullChecksEnabled(services.program.getCompilerOptions())) {
      context.report({
        loc: { start: { column: 0, line: 0 }, end: { column: 0, line: 0 } },
        messageId: 'noStrictNullCheck',
      });
    }

    const traversedNodes = new Set<TSESTree.Node>();

    // ── Suggestion helpers ──────────────────────────────────────────────

    function getWrappedCode(node: TSESTree.Expression): string {
      const code = sourceCode.getText(node);
      return needsWrapping(node) ? `(${code})` : code;
    }

    function getSuggestions(
      messageId: MessageId,
      node: TSESTree.Expression
    ): {
      messageId: MessageId;
      fix: (fixer: TSESLint.RuleFixer) => TSESLint.RuleFix | null;
    }[] {
      const wrapped = getWrappedCode(node);
      const raw = sourceCode.getText(node);

      switch (messageId) {
        case 'conditionErrorNullableBoolean':
          return [
            {
              messageId: 'fixCompareTrue',
              fix: (fixer) => fixer.replaceText(node, `${wrapped} === true`),
            },
            {
              messageId: 'fixCompareFalse',
              fix: (fixer) => fixer.replaceText(node, `${wrapped} === false`),
            },
            {
              messageId: 'fixCompareNullish',
              fix: (fixer) => fixer.replaceText(node, `${wrapped} != null`),
            },
            {
              messageId: 'fixDefaultFalse',
              fix: (fixer) => fixer.replaceText(node, `(${raw} ?? false)`),
            },
          ];

        case 'conditionErrorNullableString':
          return [
            {
              messageId: 'fixCompareEmptyString',
              fix: (fixer) => fixer.replaceText(node, `${wrapped} !== ""`),
            },
            {
              messageId: 'fixCompareNullish',
              fix: (fixer) => fixer.replaceText(node, `${wrapped} != null`),
            },
            {
              messageId: 'fixDefaultEmptyString',
              fix: (fixer) => fixer.replaceText(node, `(${raw} ?? "")`),
            },
          ];

        case 'conditionErrorNullableNumber':
          return [
            {
              messageId: 'fixCompareZero',
              fix: (fixer) => fixer.replaceText(node, `${wrapped} !== 0`),
            },
            {
              messageId: 'fixCompareNaN',
              fix: (fixer) => fixer.replaceText(node, `!Number.isNaN(${raw})`),
            },
            {
              messageId: 'fixCompareNullish',
              fix: (fixer) => fixer.replaceText(node, `${wrapped} != null`),
            },
            {
              messageId: 'fixDefaultZero',
              fix: (fixer) => fixer.replaceText(node, `(${raw} ?? 0)`),
            },
          ];

        case 'conditionErrorNullableObject':
        case 'conditionErrorNullableEnum':
          return [
            {
              messageId: 'fixCompareNullish',
              fix: (fixer) => fixer.replaceText(node, `${wrapped} != null`),
            },
          ];

        case 'conditionErrorString':
          return [
            {
              messageId: 'fixCompareEmptyString',
              fix: (fixer) => fixer.replaceText(node, `${wrapped} !== ""`),
            },
            {
              messageId: 'fixCompareStringLength',
              fix: (fixer) => fixer.replaceText(node, `${wrapped}.length > 0`),
            },
            {
              messageId: 'fixCastBoolean',
              fix: (fixer) => fixer.replaceText(node, `Boolean(${raw})`),
            },
          ];

        case 'conditionErrorNumber':
          return [
            {
              messageId: 'fixCompareZero',
              fix: (fixer) => fixer.replaceText(node, `${wrapped} !== 0`),
            },
            {
              messageId: 'fixCompareNaN',
              fix: (fixer) => fixer.replaceText(node, `!Number.isNaN(${raw})`),
            },
            {
              messageId: 'fixCastBoolean',
              fix: (fixer) => fixer.replaceText(node, `Boolean(${raw})`),
            },
          ];

        default:
          return [];
      }
    }

    // ── Core check ──────────────────────────────────────────────────────

    function checkNode(node: TSESTree.Expression, contextStr: string): void {
      const tsNode = services.esTreeNodeToTSNodeMap.get(node);
      const type = checker.getTypeAtLocation(tsNode);
      const kinds = classifyType(type, checker);
      const violation = getViolation(kinds, options);
      if (violation) {
        const suggest = getSuggestions(violation, node);
        context.report({
          node,
          messageId: violation,
          data: { context: contextStr },
          ...(suggest.length > 0 ? { suggest } : {}),
        });
      }
    }

    // ── Traversal ───────────────────────────────────────────────────────

    function traverseNode(
      node: TSESTree.Expression,
      isCondition: boolean,
      contextStr: string,
      isValueProducing?: boolean
    ): void {
      if (traversedNodes.has(node)) return;
      traversedNodes.add(node);

      if (node.type === AST_NODE_TYPES.LogicalExpression && node.operator !== '??') {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define -- mutual recursion
        traverseLogicalExpression(node, isCondition, contextStr, isValueProducing);
        return;
      }

      if (!isCondition) return;

      checkNode(node, contextStr);
    }

    function traverseLogicalExpression(
      node: TSESTree.LogicalExpression,
      isCondition: boolean,
      contextStr: string,
      parentIsValueProducing?: boolean
    ): void {
      let valueProducing = parentIsValueProducing;
      if (valueProducing === undefined && !isCondition && options.allowNonBooleanExpressions) {
        const tsNode = services.esTreeNodeToTSNodeMap.get(node);
        const resultType = checker.getTypeAtLocation(tsNode);
        const resultKinds = classifyType(resultType, checker);
        valueProducing = isNonBooleanValueType(resultKinds);
      }

      traverseNode(node.left, true, contextStr, valueProducing);

      const rightIsCondition =
        node.operator === '&&' && valueProducing === true ? false : isCondition;

      traverseNode(node.right, rightIsCondition, contextStr, valueProducing);
    }

    // ── Truthiness assertions ───────────────────────────────────────────

    function findAssertedArgument(node: TSESTree.CallExpression): TSESTree.Expression | undefined {
      const calleeType = services.getTypeAtLocation(node.callee);

      for (const signature of calleeType.getCallSignatures()) {
        const declaration = signature.getDeclaration();
        const returnType = declaration.type;

        if (
          returnType != null &&
          ts.isTypePredicateNode(returnType) &&
          returnType.assertsModifier != null &&
          returnType.type == null &&
          ts.isIdentifier(returnType.parameterName)
        ) {
          const { parameterName } = returnType;
          const paramIndex = declaration.parameters.findIndex(
            (p) => ts.isIdentifier(p.name) && p.name.text === parameterName.text
          );
          if (paramIndex >= 0 && paramIndex < node.arguments.length) {
            return node.arguments[paramIndex] as TSESTree.Expression;
          }
        }
      }
      return undefined;
    }

    // ── Array predicates ────────────────────────────────────────────────

    function isArrayMethodCall(node: TSESTree.CallExpression): boolean {
      if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return false;
      if (node.callee.computed) return false;
      if (node.arguments.length === 0) return false;
      if (node.callee.property.type !== AST_NODE_TYPES.Identifier) return false;
      if (!ARRAY_PREDICATE_METHODS.has(node.callee.property.name)) return false;

      const objectType = services.getTypeAtLocation(node.callee.object);
      return isArrayLikeType(objectType, checker);
    }

    function findReturnExpressions(body: TSESTree.BlockStatement): TSESTree.Expression[] {
      const results: TSESTree.Expression[] = [];

      function visitStatement(node: TSESTree.Statement): void {
        if (node.type === AST_NODE_TYPES.ReturnStatement) {
          if (node.argument) results.push(node.argument);
        } else if (node.type === AST_NODE_TYPES.FunctionDeclaration) {
          // don't enter nested function scopes
        } else if (node.type === AST_NODE_TYPES.BlockStatement) {
          for (const stmt of node.body) visitStatement(stmt);
        } else if (node.type === AST_NODE_TYPES.IfStatement) {
          visitStatement(node.consequent);
          if (node.alternate) visitStatement(node.alternate);
        } else if (node.type === AST_NODE_TYPES.SwitchStatement) {
          for (const c of node.cases) {
            for (const stmt of c.consequent) visitStatement(stmt);
          }
        } else if (node.type === AST_NODE_TYPES.TryStatement) {
          visitStatement(node.block);
          if (node.handler) visitStatement(node.handler.body);
          if (node.finalizer) visitStatement(node.finalizer);
        } else if (node.type === AST_NODE_TYPES.LabeledStatement) {
          visitStatement(node.body);
        } else if (
          node.type === AST_NODE_TYPES.ForStatement ||
          node.type === AST_NODE_TYPES.ForInStatement ||
          node.type === AST_NODE_TYPES.ForOfStatement ||
          node.type === AST_NODE_TYPES.WhileStatement ||
          node.type === AST_NODE_TYPES.DoWhileStatement
        ) {
          visitStatement(node.body);
        }
      }

      for (const stmt of body.body) visitStatement(stmt);
      return results;
    }

    function isExplicitBooleanLiteral(node: TSESTree.Expression): boolean {
      return node.type === AST_NODE_TYPES.Literal && typeof node.value === 'boolean';
    }

    function checkPredicateBody(body: TSESTree.BlockStatement): void {
      for (const expr of findReturnExpressions(body)) {
        if (!isExplicitBooleanLiteral(expr)) {
          traverseNode(expr, true, 'filtering an array');
        }
      }
    }

    function checkBooleanPredicate(node: TSESTree.CallExpression): void {
      if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return;

      const objectType = services.getTypeAtLocation(node.callee.object);
      const elementType = objectType.getNumberIndexType();
      if (elementType == null) return;

      const kinds = classifyType(elementType, checker);
      const violation = getViolation(kinds, options);
      if (violation) {
        context.report({
          node: node.arguments[0],
          messageId: violation,
          data: { context: 'filtering an array' },
        });
      }
    }

    function traverseCallExpression(node: TSESTree.CallExpression): void {
      const assertedArg = findAssertedArgument(node);
      if (assertedArg) {
        traverseNode(assertedArg, true, 'an assertion');
      }

      if (isArrayMethodCall(node)) {
        const predicate = node.arguments[0];

        if (predicate.type === AST_NODE_TYPES.ArrowFunctionExpression) {
          if (predicate.body.type !== AST_NODE_TYPES.BlockStatement) {
            if (!isExplicitBooleanLiteral(predicate.body)) {
              traverseNode(predicate.body, true, 'filtering an array');
            }
          } else {
            checkPredicateBody(predicate.body);
          }
        } else if (predicate.type === AST_NODE_TYPES.FunctionExpression) {
          checkPredicateBody(predicate.body);
        } else if (predicate.type === AST_NODE_TYPES.Identifier && predicate.name === 'Boolean') {
          checkBooleanPredicate(node);
        }
      }
    }

    // ── Visitors ────────────────────────────────────────────────────────

    return {
      IfStatement(node) {
        traverseNode(node.test, true, 'conditional');
      },
      WhileStatement(node) {
        traverseNode(node.test, true, 'conditional');
      },
      DoWhileStatement(node) {
        traverseNode(node.test, true, 'conditional');
      },
      ForStatement(node) {
        if (node.test) traverseNode(node.test, true, 'conditional');
      },
      ConditionalExpression(node) {
        traverseNode(node.test, true, 'conditional');
      },
      'UnaryExpression[operator="!"]': function (node: TSESTree.UnaryExpression) {
        traverseNode(node.argument, true, 'conditional');
      },
      'LogicalExpression[operator!="??"]': function (node: TSESTree.LogicalExpression) {
        traverseLogicalExpression(node, false, 'conditional');
      },
      CallExpression: traverseCallExpression,
    };
  },
});

export default rule;
