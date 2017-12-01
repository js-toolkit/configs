// Grab NODE_ENV and REACT_APP_* environment variables and prepare them to be
// injected into the application via DefinePlugin in Webpack configuration.
const REACT_APP = /^REACT_APP_/i;

export function getReactEnvironment() {
  // Object with keys and their default values so we can feed into Webpack EnvironmentPlugin
  const raw = Object.keys(process.env)
    .filter(key => REACT_APP.test(key))
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
    raw,
    stringified,
    get ssr() {
      return this.raw.REACT_APP_SSR === 'true';
    },
    get dev() {
      return this.raw.NODE_ENV === 'development';
    },
    get prod() {
      return this.raw.NODE_ENV === 'production';
    },
    ifDevMode(devModeValue, elseValue) {
      return this.dev ? devModeValue : elseValue;
    },
    ifProdMode(prodModeValue, elseValue) {
      return this.prod ? prodModeValue : elseValue;
    },
    ifDevServer(devServerValue, elseValue) {
      return this.raw.REACT_APP_DEV_SERVER ? devServerValue : elseValue;
    },
  };
}

export default getReactEnvironment();
