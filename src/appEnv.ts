export type NodeEnv = 'development' | 'production';

export type EnvVarType = string | number | boolean | undefined;

export interface RawAppEnv {
  NODE_ENV: NodeEnv;
  APP_SSR: boolean;
  APP_DEV_SERVER: boolean;
  [P: string]: EnvVarType;
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

// Grab NODE_ENV and APP_* environment variables and prepare them to be
// injected into the application via DefinePlugin in Webpack configuration.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function getAppEnvironment() {
  // Object with keys and their default values so we can feed into Webpack EnvironmentPlugin
  const raw: RawAppEnv = Object.keys(process.env)
    .filter((key) => APP.test(key))
    .reduce((env, key) => ({ ...env, [key]: tryParse(process.env[key]) }), {
      // Useful for determining whether we’re running in production mode.
      // Most importantly, it switches React into the correct mode.
      NODE_ENV: tryParse(process.env.NODE_ENV || 'development') as NodeEnv,
      APP_SSR: false,
      APP_DEV_SERVER: false,
    });

  return {
    /** Object with keys and their default values so we can feed into Webpack EnvironmentPlugin. */
    raw,

    /** Stringify all values that we can feed into Webpack DefinePlugin. */
    envStringify(): { 'process.env': Record<string, string | undefined> } {
      const stringified = Object.keys(this.raw).reduce(
        (env, key) => ({ ...env, [key]: JSON.stringify(this.raw[key]) }),
        {}
      );
      return { 'process.env': stringified };
    },

    get<A extends EnvVarType>(envVarName: string): A {
      return raw[envVarName] as A;
    },

    /** Use APP_SSR environment variable */
    get ssr(): boolean {
      return this.raw.APP_SSR === true;
    },

    /** Use NODE_ENV environment variable */
    get dev(): boolean {
      return this.raw.NODE_ENV === 'development';
    },

    /** Use NODE_ENV environment variable */
    get prod(): boolean {
      return this.raw.NODE_ENV === 'production';
    },

    /** Use NODE_ENV environment variable */
    ifDevMode<T>(devModeValue: (() => T) | T, elseValue: (() => T) | T): T {
      if (this.dev) {
        return typeof devModeValue === 'function' ? (devModeValue as Function)() : devModeValue;
      }
      return typeof elseValue === 'function' ? (elseValue as Function)() : elseValue;
    },

    /** Use NODE_ENV environment variable */
    ifProdMode<T>(prodModeValue: (() => T) | T, elseValue: (() => T) | T): T {
      if (this.prod) {
        return typeof prodModeValue === 'function' ? (prodModeValue as Function)() : prodModeValue;
      }
      return typeof elseValue === 'function' ? (elseValue as Function)() : elseValue;
    },

    /** Use APP_DEV_SERVER environment variable */
    get devServer(): boolean {
      return this.raw.APP_DEV_SERVER === true;
    },

    /** Use APP_DEV_SERVER environment variable */
    ifDevServer<T>(devServerValue: T, elseValue: T): T {
      return this.devServer ? devServerValue : elseValue;
    },
  };
}

/**
 * App environment variables.
 * User defined environment variables must start with APP_.
 */
const appEnv = getAppEnvironment();

export default appEnv;
