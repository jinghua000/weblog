
(function(modules) {
  function requireId(id) {

    const [fn, mapping] = modules[id];
    
    function require (filename) {
      return requireId(mapping[filename]);
    }

    const exports = {}

    fn(require, exports);

    return exports;
  }

  requireId(0);
})({0: [
      function (require, exports) { "use strict";

var _hello = require("./hello");

var _world = require("./world");

console.log(_hello.hello + ' ' + _world.world); },
      {"./hello":1,"./world":2},
    ],1: [
      function (require, exports) { "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hello = void 0;
var hello = 'simple';
exports.hello = hello; },
      {},
    ],2: [
      function (require, exports) { "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.world = void 0;
var world = 'pack';
exports.world = world; },
      {},
    ],})

