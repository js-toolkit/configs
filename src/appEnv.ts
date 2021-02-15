export type NodeEnv = 'development' | 'production';

export type EnvVarType = string | number | boolean | undefined;

/** Useful with module augmentation */
export interface AppEnvVars {
  NODE_ENV: NodeEnv;
  APP_SSR: boolean;
}

type ValueGetter<T> = () => T;
type ValueOrGetter<T> = T | ValueGetter<T>;

export interface AppEnvironment {
  /** Object with keys and their default values so we can feed into Webpack EnvironmentPlugin. */
  raw: AppEnvVars;

  /** Stringify all values that we can feed into Webpack DefinePlugin. */
  envStringify(): { 'process.env': Record<string, string> };

  has<T extends keyof AppEnvVars>(envVarName: T): boolean;

  get<T extends keyof AppEnvVars>(envVarName: T): AppEnvVars[T];

  /** Use APP_SSR environment variable */
  ssr: boolean;

  /** Use NODE_ENV environment variable */
  dev: boolean;

  /** Use NODE_ENV environment variable */
  prod: boolean;

  /** Use NODE_ENV environment variable */
  ifDev<T>(devModeValue: ValueOrGetter<T>, elseValue: ValueOrGetter<T>): T;

  /** Use NODE_ENV environment variable */
  ifProd<T>(prodModeValue: ValueOrGetter<T>, elseValue: ValueOrGetter<T>): T;
}

const APP = /^APP_/i;

function tryParse(value?: string): EnvVarType {
  if (value == null) return value;
  try {
    return JSON.parse(value) as EnvVarType;
  } catch {
    // Simple string values are unable parsed so we just return origin.
    return value;
  }
}

/**
 * Grab NODE_ENV and APP_* environment variables and prepare them to be
 * injected into the application via DefinePlugin in Webpack configuration.
 */
export function getAppEnvironment(): AppEnvironment {
  const rawEnv = process.env;

  // Object with keys and their default values so we can feed into Webpack EnvironmentPlugin
  const raw: AppEnvVars = Object.keys(rawEnv)
    .filter((key) => APP.test(key))
    .reduce(
      (env, key) => {
        // eslint-disable-next-line no-param-reassign
        env[key] = tryParse(rawEnv[key]);
        return env;
      },
      {
        // Useful for determining whether we’re running in production mode.
        // Most importantly, it switches React into the correct mode.
        NODE_ENV: tryParse(rawEnv.NODE_ENV || 'development') as NodeEnv,
        APP_SSR: false,
      }
    );

  const appEnv: AppEnvironment = {
    raw,

    envStringify() {
      const stringified = Object.keys(this.raw).reduce((env, key) => {
        // eslint-disable-next-line no-param-reassign
        env[key] = JSON.stringify(this.raw[key]);
        return env;
      }, {});
      return { 'process.env': stringified };
    },

    has<T extends keyof AppEnvVars>(envVarName: T) {
      return envVarName in raw;
    },

    get<T extends keyof AppEnvVars>(envVarName: T): AppEnvVars[T] {
      return raw[envVarName];
    },

    get ssr() {
      return this.raw.APP_SSR === true;
    },

    get dev() {
      return this.raw.NODE_ENV === 'development';
    },

    get prod() {
      return this.raw.NODE_ENV === 'production';
    },

    ifDev<T>(devModeValue: ValueOrGetter<T>, elseValue: ValueOrGetter<T>): T {
      if (this.dev) {
        return typeof devModeValue === 'function'
          ? (devModeValue as ValueGetter<T>)()
          : devModeValue;
      }
      return typeof elseValue === 'function' ? (elseValue as ValueGetter<T>)() : elseValue;
    },

    ifProd<T>(prodModeValue: ValueOrGetter<T>, elseValue: ValueOrGetter<T>): T {
      if (this.prod) {
        return typeof prodModeValue === 'function'
          ? (prodModeValue as ValueGetter<T>)()
          : prodModeValue;
      }
      return typeof elseValue === 'function' ? (elseValue as ValueGetter<T>)() : elseValue;
    },
  };

  if ((typeof window === 'undefined' ? global : window).Proxy) {
    return new Proxy(appEnv, {
      // prop always is string or symbol, not number
      get(target, prop) {
        if (typeof prop === 'string' && !(prop in target)) {
          return target.raw[prop];
        }
        return target[prop];
      },
      has(target, prop) {
        return prop in target || prop in target.raw;
      },
    });
  }

  return appEnv;
}

/**
 * App environment variables.
 * User defined environment variables must start with APP_.
 */
const appEnv = getAppEnvironment();

export default appEnv;
