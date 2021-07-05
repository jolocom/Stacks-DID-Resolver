"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STX_TO_BURN = exports.lifetime = exports.priceFunction = void 0;
const BN = require("bn.js");
exports.priceFunction = {
    base: new BN(1),
    coefficient: new BN(1),
    b1: new BN(1),
    b2: new BN(2),
    b3: new BN(3),
    b4: new BN(4),
    b5: new BN(5),
    b6: new BN(6),
    b7: new BN(7),
    b8: new BN(8),
    b9: new BN(9),
    b10: new BN(10),
    b11: new BN(11),
    b12: new BN(12),
    b13: new BN(13),
    b14: new BN(14),
    b15: new BN(15),
    b16: new BN(16),
    nonAlphaDiscount: new BN(0),
    noVowelDiscount: new BN(0),
};
exports.lifetime = new BN(10000);
exports.STX_TO_BURN = new BN(300000000000000);
//# sourceMappingURL=constants.js.map