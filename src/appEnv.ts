// Grab NODE_ENV and APP_* environment variables and prepare them to be
// injected into the application via DefinePlugin in Webpack configuration.
const APP = /^APP_/i;

export type NodeEnv = 'development' | 'production';

export interface RawAppEnv {
  NODE_ENV: NodeEnv;
  APP_SSR?: string;
  [P: string]: string | undefined;
}

export function getAppEnvironment() {
  // Object with keys and their default values so we can feed into Webpack EnvironmentPlugin
  const raw: RawAppEnv = Object.keys(process.env)
    .filter(key => APP.test(key))
    .reduce((env, key) => ({ ...env, [key]: process.env[key] }), {
      // Useful for determining whether we’re running in production mode.
      // Most importantly, it switches React into the correct mode.
      NODE_ENV: (process.env.NODE_ENV as NodeEnv) || 'development',
    });

  // Stringify all values so we can feed into Webpack DefinePlugin
  const stringified = {
    'process.env': Object.keys(raw).reduce(
      (env, key) => ({ ...env, [key]: JSON.stringify(raw[key]) }),
      {}
    ),
  };

  return {
    /** Object with keys and their default values so we can feed into Webpack EnvironmentPlugin. */
    raw,
    /** All values that we can feed into Webpack DefinePlugin. */
    stringified,

    get ssr() {
      return this.raw.APP_SSR === 'true';
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

const appEnv = getAppEnvironment();

export default appEnv;
