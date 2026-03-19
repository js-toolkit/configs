import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/js-toolkit/configs/blob/main/src/eslint/rules/${name}.ts`
);

type MessageId = 'noNamespace';

/**
 * Extracts the actual declaration node from a sibling,
 * unwrapping `export` wrappers when present.
 */
function unwrapDeclaration(sibling: TSESTree.Node): TSESTree.Node | undefined {
  if (sibling.type === AST_NODE_TYPES.ExportNamedDeclaration) {
    return sibling.declaration ?? undefined;
  }
  return sibling;
}

function getDeclarationName(node: TSESTree.Node): string | undefined {
  switch (node.type) {
    case AST_NODE_TYPES.ClassDeclaration:
    case AST_NODE_TYPES.FunctionDeclaration:
    case AST_NODE_TYPES.TSInterfaceDeclaration:
    case AST_NODE_TYPES.TSTypeAliasDeclaration:
    case AST_NODE_TYPES.TSEnumDeclaration:
      return node.id?.name;

    case AST_NODE_TYPES.VariableDeclaration:
      for (const declarator of node.declarations) {
        if (declarator.id.type === AST_NODE_TYPES.Identifier) {
          return declarator.id.name;
        }
      }
      return undefined;

    default:
      return undefined;
  }
}

function isInDeclareContext(node: TSESTree.TSModuleDeclaration): boolean {
  if (node.declare) return true;
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (current.type === AST_NODE_TYPES.TSModuleDeclaration && current.declare) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

export default createRule<[], MessageId>({
  name: 'no-namespace-except-declaration-merge',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow namespaces except when merging with a same-named declaration (class, variable, function, interface, type alias, or enum)',
    },
    schema: [],
    messages: {
      noNamespace:
        "Namespace '{{name}}' is only allowed for declaration merging with a same-named declaration.",
    },
    defaultOptions: [],
  },

  create(context) {
    return {
      TSModuleDeclaration(node) {
        if (isInDeclareContext(node)) return;

        if (node.kind === 'module' && node.id.type === AST_NODE_TYPES.Literal) return;

        if (node.id.type !== AST_NODE_TYPES.Identifier) return;

        const namespaceName = node.id.name;

        const { parent } = node;

        let siblings: TSESTree.Node[] = [];

        if (
          parent.type === AST_NODE_TYPES.Program ||
          parent.type === AST_NODE_TYPES.TSModuleBlock
        ) {
          siblings = parent.body;
        } else if (parent.type === AST_NODE_TYPES.ExportNamedDeclaration) {
          const grandparent = parent.parent as TSESTree.Node;
          if (
            grandparent.type === AST_NODE_TYPES.Program ||
            grandparent.type === AST_NODE_TYPES.TSModuleBlock
          ) {
            siblings = grandparent.body;
          }
        }

        const hasMergingSibling = siblings.some((sibling) => {
          const declaration = unwrapDeclaration(sibling);
          if (!declaration || declaration === node) return false;

          if (declaration.type === AST_NODE_TYPES.TSModuleDeclaration) return false;

          return getDeclarationName(declaration) === namespaceName;
        });

        if (!hasMergingSibling) {
          context.report({
            node,
            messageId: 'noNamespace',
            data: { name: namespaceName },
          });
        }
      },
    };
  },
});
