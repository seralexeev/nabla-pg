/* eslint-disable */
const path = require('path');

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.[jt]s?(x)'],
    testTimeout: 25000,
};
