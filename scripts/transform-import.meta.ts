import * as ts from 'typescript';

export default function transformImportMetaToCjs(): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile) => {
      const visitor = (node: ts.Node): ts.Node => {
        // Ищем import.meta.dirname
        if (
          ts.isPropertyAccessExpression(node) &&
          ts.isMetaProperty(node.expression) &&
          node.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
          node.expression.name.text === 'meta'
        ) {
          // Ищем import.meta.dirname
          if (node.name.text === 'dirname')
            // Заменяем на __dirname
            return context.factory.createIdentifier('__dirname');
          // Ищем import.meta.filename|url
          if (node.name.text === 'filename' || node.name.text === 'url')
            // Заменяем на __filename
            return context.factory.createIdentifier('__filename');
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitEachChild(sourceFile, visitor, context);
    };
  };
}
