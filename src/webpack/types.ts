export type RequiredStrict<T> = { [P in keyof T]-?: Exclude<T[P], undefined> };

export type OptionalToUndefined<T> = {
  [K in keyof T]: undefined extends T[K] ? T[K] | undefined : T[K];
};
