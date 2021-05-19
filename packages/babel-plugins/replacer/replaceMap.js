/* eslint-disable */
const ip = require('ip');

const ipAddress = ip.address();

module.exports = [
    {
        find: '__IP_ADDRESS__',
        replaceWith: ipAddress,
    },
    {
        find: '__FLSTK_CLIENT_APP_ENV__',
        replaceWith: process.env.FLSTK_CLIENT_APP_ENV || 'prod',
    },
];