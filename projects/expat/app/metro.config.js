const { getDefaultConfig } = require('metro-config');
const path = require('path');

module.exports = (async () => {
    const {
        resolver: { sourceExts, assetExts },
    } = await getDefaultConfig();

    return {
        transformer: {
            babelTransformerPath: require.resolve('react-native-svg-transformer'),
            getTransformOptions: async () => ({
                transform: {
                    experimentalImportSupport: false,
                    inlineRequires: false,
                },
            }),
        },
        resolver: {
            assetExts: assetExts.filter((ext) => ext !== 'svg'),
            sourceExts: [...sourceExts, 'svg'],
        },
        // slow, should be optimized
        watchFolders: [path.resolve(__dirname, '../../../')],
    };
})();
