// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyObject = Record<string, any>;

export type OptionalToUndefined<T> = {
  [K in keyof T]: undefined extends T[K] ? T[K] | undefined : T[K];
};

export type RequiredStrict<T> = {
  [P in keyof T]-?: Exclude<T[P], undefined>;
};

export type PickInner<T, K extends keyof T, IK extends keyof NonNullable<T[K]>> = T extends T
  ? {
      [P in keyof T]: P extends K
        ? Pick<NonNullable<T[P]>, IK extends keyof T[P] ? IK : never>
        : T[P];
    }
  : never;

export type PartialSome<T, K extends keyof T> = T extends T
  ? Omit<T, K> & { [P in K]?: T[P] }
  : never;
