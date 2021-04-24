import tsPlugin from 'rollup-plugin-typescript2';
import ttypescript from 'ttypescript';

const name = require('./package.json').main.replace(/\.js$/, '');

export default {
    input: 'src/index.ts',
    external: (id) => !/^[./]/.test(id),
    output: [{ name }],
    plugins: [tsPlugin({ typescript: ttypescript })],
};
