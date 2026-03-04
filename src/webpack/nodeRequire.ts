/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable no-var */

import { defaultRequire } from '../defaultRequire.ts';

declare var __webpack_require__: NodeRequire;
declare var __non_webpack_require__: NodeRequire;

/** Original require function (non webpack) to correct load modules in universal projects */
const nodeRequire =
  typeof __webpack_require__ === 'function' ? __non_webpack_require__ : defaultRequire;

export default nodeRequire;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = nodeRequire;
}
