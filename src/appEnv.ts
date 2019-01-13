export type NodeEnv = 'development' | 'production';

export interface RawAppEnv {
  NODE_ENV: NodeEnv;
  APP_SSR: boolean;
  APP_DEV_SERVER: boolean;
  [P: string]: string | number | boolean;
}

const APP = /^APP_/i;

function tryParse(value?: string) {
  if (value == null) return value;
  try {
    return JSON.parse(value);
  } catch {
    // Simple string values are unable parsed so we just return origin.
    return value;
  }
}

// Grab NODE_ENV and APP_* environment variables and prepare them to be
// injected into the application via DefinePlugin in Webpack configuration.
export function getAppEnvironment() {
  // Object with keys and their default values so we can feed into Webpack EnvironmentPlugin
  const raw: RawAppEnv = Object.keys(process.env)
    .filter(key => APP.test(key))
    .reduce((env, key) => ({ ...env, [key]: tryParse(process.env[key]) }), {
      // Useful for determining whether we’re running in production mode.
      // Most importantly, it switches React into the correct mode.
      NODE_ENV: tryParse((process.env.NODE_ENV as NodeEnv) || 'development'),
      APP_SSR: false,
      APP_DEV_SERVER: false,
    });

  return {
    /** Object with keys and their default values so we can feed into Webpack EnvironmentPlugin. */
    raw,

    /** Stringify all values that we can feed into Webpack DefinePlugin. */
    envStringify() {
      const stringified = Object.keys(this.raw).reduce(
        (env, key) => ({ ...env, [key]: JSON.stringify(this.raw[key]) }),
        {}
      );
      return { 'process.env': stringified };
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

    ifDevMode<T>(devModeValue: T, elseValue: T) {
      return this.dev ? devModeValue : elseValue;
    },

    ifProdMode<T>(prodModeValue: T, elseValue: T) {
      return this.prod ? prodModeValue : elseValue;
    },

    ifDevServer<T>(devServerValue: T, elseValue: T) {
      return this.raw.APP_DEV_SERVER ? devServerValue : elseValue;
    },
  };
}

/** App environment variables */
const appEnv = getAppEnvironment();

export default appEnv;
