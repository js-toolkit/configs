import type { Linter } from 'eslint';

export function addFilesGlob(conf: Linter.Config, glob: string): Linter.Config {
  // Skip global ignores if there are no files specified
  if ((conf.ignores?.length ?? 0) > 0 && (conf.files?.length ?? 0) === 0) {
    return conf;
  }
  return {
    ...conf,
    files: [...(conf.files ?? []), glob],
  };
}
