const path = require('path');

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/test/**/*.test.[jt]s?(x)'],
    moduleNameMapper: {
        '@flstk/(.*?)/(.*)$': path.resolve(__dirname, '../$1/src/$2'),
    },
    testTimeout: 25000,
};
