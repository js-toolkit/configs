/* eslint-disable import-x/no-named-as-default-member */
import path from 'path';
import ts from 'typescript';
import transformer from './transform-import.meta.ts';

// Читаем tsconfig
const configPath = ts.findConfigFile('./', ts.sys.fileExists.bind(ts.sys), 'tsconfig.cjs.json');
if (!configPath) throw new Error('tsconfig.cjs.json not found');

const configFile = ts.readConfigFile(configPath, ts.sys.readFile.bind(ts.sys));
const parsedConfig = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  path.dirname(configPath)
);

// Переопределяем после парсинга
parsedConfig.options.incremental = false;

// Создаём программу
const program = ts.createProgram({
  rootNames: parsedConfig.fileNames,
  options: parsedConfig.options,
});

// Запускаем emit с трансформером
const result = program.emit(
  undefined, // все файлы
  undefined, // стандартный writeFile
  undefined,
  false,
  {
    before: [transformer()],
  }
);

// Фильтруем ошибки связанные с import.meta
const IGNORED_CODES = new Set([
  1343, // import.meta only allowed in ESM
  1471, // module is not ESM
]);

// Проверяем ошибки
const diagnostics = ts
  .getPreEmitDiagnostics(program)
  .concat(result.diagnostics)
  .filter((d) => !IGNORED_CODES.has(d.code));

if (diagnostics.length > 0) {
  const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => process.cwd(),
    getCanonicalFileName: (f) => f,
    getNewLine: () => '\n',
  });
  console.error(formatted);
  process.exit(1);
}

console.log('Build complete');
