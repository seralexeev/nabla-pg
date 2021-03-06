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
                react: path.resolve(__dirname, '../../../node_modules/react'),

                // TODO: generalize it
                '@flstk/utils': path.resolve(__dirname, '../../../packages/utils/src'),
                '@flstk/result': path.resolve(__dirname, '../../../packages/result/src'),
                '@flstk/use-api': path.resolve(__dirname, '../../../packages/use-api/src'),
                '@flstk/react-core': path.resolve(__dirname, '../../../packages/react-core/src'),
                '@flstk/react-native': path.resolve(__dirname, '../../../packages/react-native/src'),

                '@projects/expat/app': path.resolve(__dirname, '../app/src'),
                '@projects/expat/api': path.resolve(__dirname, '../api/src'),
                '@projects/expat/shared': path.resolve(__dirname, '../shared/src'),
                '@projects/expat/shared': path.resolve(__dirname, '../shared/src'),
            },
        },
    ],
    '@babel/plugin-proposal-export-namespace-from',
    '../../../packages/babel-plugins/replacer',
];

module.exports = {
    presets: ['module:metro-react-native-babel-preset'],
    plugins,
};
