// Grab NODE_ENV and APP_* environment variables and prepare them to be
// injected into the application via DefinePlugin in Webpack configuration.
const APP = /^APP_/i;

export function getAppEnvironment() {
  // Object with keys and their default values so we can feed into Webpack EnvironmentPlugin
  const raw = Object.keys(process.env)
    .filter(key => APP.test(key))
    .reduce((env, key) => ({ ...env, [key]: process.env[key] }), {
      // Useful for determining whether we’re running in production mode.
      // Most importantly, it switches React into the correct mode.
      NODE_ENV: process.env.NODE_ENV || 'development',
    });

  // Stringify all values so we can feed into Webpack DefinePlugin
  const stringified = {
    'process.env': Object.keys(raw).reduce(
      (env, key) => ({ ...env, [key]: JSON.stringify(raw[key]) }),
      {}
    ),
  };

  return {
    ...raw,
    stringified,
    get ssr() {
      return this.APP_SSR === 'true';
    },
    get dev() {
      return this.NODE_ENV === 'development';
    },
    get prod() {
      return this.NODE_ENV === 'production';
    },
    ifDevMode(devModeValue, elseValue) {
      return this.dev ? devModeValue : elseValue;
    },
    ifProdMode(prodModeValue, elseValue) {
      return this.prod ? prodModeValue : elseValue;
    },
    ifDevServer(devServerValue, elseValue) {
      return this.APP_DEV_SERVER ? devServerValue : elseValue;
    },
  };
}

export default getAppEnvironment();
