"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wait = exports.waitForConfirmation = exports.getKeyPair = void 0;
const transactions_1 = require("@stacks/transactions");
const api_1 = require("../api");
const fluture_1 = __importStar(require("fluture"));
const getKeyPair = (privateKey) => {
    const priv = privateKey
        ? transactions_1.createStacksPrivateKey(privateKey)
        : transactions_1.makeRandomPrivKey();
    const publicKey = transactions_1.getPublicKey(priv);
    return {
        privateKey: priv,
        publicKey: transactions_1.isCompressed(publicKey)
            ? publicKey
            : transactions_1.compressPublicKey(publicKey.data),
    };
};
exports.getKeyPair = getKeyPair;
const waitForConfirmation = (txId, delay = 3000) => {
    return exports.wait(delay)
        .pipe(fluture_1.chain(() => api_1.fetchTransactionById(txId)))
        .pipe(fluture_1.chain((tx) => {
        if (tx.tx_status === "pending") {
            return exports.waitForConfirmation(txId);
        }
        if (tx.tx_status === "success") {
            return fluture_1.resolve(tx);
        }
        return fluture_1.reject(new Error(`Tx failed, ${tx.tx_status} ${txId}`));
    }));
};
exports.waitForConfirmation = waitForConfirmation;
const wait = (ms) => {
    return fluture_1.default((_, res) => {
        const t = setTimeout(res, ms);
        return () => clearTimeout(t);
    });
};
exports.wait = wait;
//# sourceMappingURL=utils.js.map