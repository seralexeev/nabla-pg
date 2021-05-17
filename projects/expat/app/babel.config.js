const path = require('path');

const plugins = [
    [
        require.resolve('babel-plugin-module-resolver'),
        {
            extensions: [
                '.js',
                '.jsx',
                '.ts',
                '.tsx',
                '.ios.js',
                '.ios.jsx',
                '.ios.ts',
                '.ios.tsx',
                '.android.js',
                '.android.jsx',
                '.android.ts',
                '.android.tsx',
                '.json',
            ],
            alias: {
                '@flstk/utils': path.resolve(__dirname, '../../packages/utils/src'),
            },
        },
    ],
    '../../packages/babel-plugins/babel-plugin-replacer',
];

module.exports = {
    presets: ['module:metro-react-native-babel-preset'],
    plugins,
};
