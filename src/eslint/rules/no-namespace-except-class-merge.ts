import type { Rule } from 'eslint';
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/types';

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow namespaces except when merging with a class of the same name',
      recommended: true,
    },
    schema: [],
    messages: {
      noNamespace:
        "Namespace '{{name}}' is only allowed for declaration merging with a class of the same name.",
    },
  },

  create(context) {
    return {
      TSModuleDeclaration(node: TSESTree.TSModuleDeclaration) {
        // Allow: declare namespace / declare module (ambient declarations)
        if (node.declare) return;

        // Allow: module "string-literal" (e.g. module augmentation)
        if (node.kind === 'module' && node.id.type === AST_NODE_TYPES.Literal) return;

        // Only handle namespace with identifier name
        if (node.id.type !== AST_NODE_TYPES.Identifier) return;

        const namespaceName = node.id.name;

        // Parent body — siblings in the same scope
        const { parent } = node;

        let siblings: TSESTree.Node[] = [];

        if (
          parent.type === AST_NODE_TYPES.Program ||
          parent.type === AST_NODE_TYPES.TSModuleBlock
        ) {
          siblings = parent.body;
        } else if (parent.type === AST_NODE_TYPES.ExportNamedDeclaration) {
          // export namespace Foo {} — look at grandparent
          const grandparent = parent.parent as TSESTree.Node;
          if (
            grandparent.type === AST_NODE_TYPES.Program ||
            grandparent.type === AST_NODE_TYPES.TSModuleBlock
          ) {
            siblings = grandparent.body;
          }
        }

        const hasMergingClass = siblings.some((sibling) => {
          // class Foo {}
          if (
            sibling.type === AST_NODE_TYPES.ClassDeclaration &&
            sibling.id?.name === namespaceName
          ) {
            return true;
          }

          // export class Foo {}
          if (
            sibling.type === AST_NODE_TYPES.ExportNamedDeclaration &&
            sibling.declaration?.type === AST_NODE_TYPES.ClassDeclaration &&
            (sibling.declaration as TSESTree.ClassDeclaration).id?.name === namespaceName
          ) {
            return true;
          }

          return false;
        });

        if (!hasMergingClass) {
          context.report({
            node,
            messageId: 'noNamespace',
            data: { name: namespaceName },
          });
        }
      },
    };
  },
};

export const plugin = {
  rules: {
    'no-namespace-except-class-merge': rule,
  },
};
