import { getInstalledPlugin } from './getInstalledPlugin';

const config = {
  presets: [getInstalledPlugin('@babel/preset-env', { loose: true })].filter((p) => !!p),
  // https://babeljs.io/docs/assumptions#migrating-from-babelpreset-envs-loose-and-spec-modes
  // assumptions: {
  //   arrayLikeIsIterable: true,
  //   constantReexports: true,
  //   ignoreFunctionLength: true,
  //   ignoreToPrimitiveHint: true,
  //   mutableTemplateObject: true,
  //   noClassCalls: true,
  //   noDocumentAll: true,
  //   noObjectSuper: true,
  //   noUndeclaredVariablesCheck: true,
  //   objectRestNoSymbols: true,
  //   privateFieldsAsProperties: true,
  //   pureGetters: true,
  //   setClassMethods: true,
  //   setComputedProperties: true,
  //   setPublicClassFields: true,
  //   setSpreadProperties: true,
  //   skipForOfIteratorClosing: true,
  //   superIsCallableConstructor: true,
  // },
  plugins: [
    getInstalledPlugin('@babel/plugin-transform-runtime'),
    getInstalledPlugin('@babel/plugin-proposal-decorators', { version: '2023-05' }),
    // Other plugins already included in preset.
  ].filter((p) => !!p),
};

module.exports = config;
export default config;
