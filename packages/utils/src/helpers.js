"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reduceBy = exports.pick = void 0;
var lodash_1 = __importDefault(require("lodash"));
var pick = function (value, keys) {
    return lodash_1.default.pick(value, keys);
};
exports.pick = pick;
var reduceBy = function (arr, keySelector, map) {
    if (map === void 0) { map = function (t) { return t; }; }
    var keySelectorFinally = lodash_1.default.isFunction(keySelector) ? keySelector : function (t) { return t[keySelector]; };
    return arr.reduce(function (acc, item, index) {
        acc[keySelectorFinally(item, index)] = map(item, index);
        return acc;
    }, {});
};
exports.reduceBy = reduceBy;
