import { createDefaultPg } from '@flstk/pg/factory';
import { generateEntityFiles } from '@flstk/pg/generator';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

const argv = yargs(hideBin(process.argv))
    .option('suffix', {
        alias: 's',
        default: 'Entity',
        describe: 'Suffix for entity name',
    })
    .option('connection', {
        alias: 'c',
        describe: 'Connection string',
    })
    .option('dir', {
        alias: 'd',
        describe: 'Entity directory',
    })
    .option('import', {
        alias: 'i',
        default: '.',
        describe: 'Entity import path (can be alias)',
    })
    .demandOption(
        ['suffix', 'dir', 'import', 'connection'],
        'Please provide both run and path arguments to work with this tool',
    )
    .help().argv;

Promise.resolve(argv).then(({ connection, dir, import: entityImportPath, suffix }) => {
    return createDefaultPg(connection as string)
        .getSchema()
        .then((schema) =>
            generateEntityFiles(schema, {
                prefix: suffix,
                entityImportPath,
                entityDir: dir as string,
            }),
        )
        .then(() => {
            console.log('Entities has been successfully generated');
            process.exit(0);
        })
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
});
