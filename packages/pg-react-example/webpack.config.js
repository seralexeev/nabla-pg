const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const ReactRefreshTypeScript = require('react-refresh-typescript');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
    mode: isDevelopment ? 'development' : 'production',
    entry: {
        main: path.resolve(__dirname, './src/index.tsx'),
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].bundle.js',
    },
    target: 'web',
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
        mainFields: ['module', 'browser', 'main'],
        alias: {
            '@flstk/pg-react': path.resolve(__dirname, '../pg-react/src'),
            '@flstk/pg-react-antd': path.resolve(__dirname, '../pg-react-antd/src'),
            '@flstk/pg-core': path.resolve(__dirname, '../pg-core/src'),
            '@flstk/result': path.resolve(__dirname, '../result/src'),
            '@flstk/use-api': path.resolve(__dirname, '../use-api/src'),
            '@flstk/utils': path.resolve(__dirname, '../utils/src'),
        },
    },
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                            // getCustomTransformers: () => ({
                            //     after: isDevelopment ? [ReactRefreshTypeScript()] : [],
                            // }),
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({ template: path.resolve(__dirname, './public/index.html') }),
        new CleanWebpackPlugin(),
        isDevelopment && new webpack.HotModuleReplacementPlugin(),
        isDevelopment && new ReactRefreshWebpackPlugin(),
    ].filter(Boolean),
    devServer: {
        historyApiFallback: true,
        contentBase: path.resolve(__dirname, './dist'),
        open: true,
        compress: true,
        hot: true,
        port: 8080,
    },
    devtool: 'eval-cheap-module-source-map',
};
