/* eslint-disable camelcase */
/* eslint-disable no-var */

declare var __webpack_require__: typeof require;
declare var __non_webpack_require__: typeof require;

/** Original require function (non webpack) to correct load modules in universal projects */
export default typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require;
