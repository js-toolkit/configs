import path from 'path';

export const moduleExtensions = [
  '.js',
  '.mjs',
  '.cjs',
  '.jsx',
  '.mjsx',
  '.cjsx',
  '.ts',
  '.mts',
  '.cts',
  '.tsx',
  '.mtsx',
  '.ctsx',
  '.d.ts',
];

function addStar(extensions: string[]): string[] {
  return extensions.map((ext) => `*${ext}`);
}

export function getFilesGlob(extensions: string[], basePath?: string): string {
  return `${path.join(basePath || '', '**/*.{') + extensions.map((ext) => ext.substring(1)).join(',')}}`;
}

export function getTSExtensions(withStar = false): string[] {
  const list = moduleExtensions.filter((ext) => ext.includes('ts'));
  return withStar ? addStar(list) : list;
}

export function getJSExtensions(withStar = false): string[] {
  const list = moduleExtensions.filter((ext) => ext.includes('js'));
  return withStar ? addStar(list) : list;
}

export function getSXExtensions(withStar = false): string[] {
  const list = moduleExtensions.filter((ext) => ext.endsWith('sx'));
  return withStar ? addStar(list) : list;
}

export function getTSXExtensions(withStar = false): string[] {
  const list = moduleExtensions.filter((ext) => ext.endsWith('tsx'));
  return withStar ? addStar(list) : list;
}

export function getNonSXExtensions(withStar = false): string[] {
  const list = moduleExtensions.filter((ext) => !ext.endsWith('sx'));
  return withStar ? addStar(list) : list;
}
