import tsPlugin from 'rollup-plugin-typescript2';
import ttypescript from 'ttypescript';

const name = require('./package.json').main.replace(/\.js$/, '');

export default {
    input: 'src/index.ts',
    external: (id) => !/^[./]/.test(id),
    output: [{ file: `${name}.js`, name, sourcemap: true }],
    plugins: [tsPlugin({ typescript: ttypescript })],
};
