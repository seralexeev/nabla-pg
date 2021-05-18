/* eslint-disable */
const replaceMap = require('./replaceMap');

module.exports = ({ types }) => {
    return {
        visitor: {
            ReferencedIdentifier(path) {
                replaceMap.forEach(({ find, replaceWith }) => {
                    if (path.node.name === find) {
                        path.replaceWith(types.stringLiteral(replaceWith));
                    }
                });
            },
        },
    };
};
