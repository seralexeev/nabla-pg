import { runMigrations } from '@flstk/pg-migration/migration';
import { createDefaultPg } from '@flstk/pg/factory';
import { promises as fs } from 'fs';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

yargs(hideBin(process.argv))
    .option('dir', {
        alias: 'd',
        describe: 'Migrations directory',
    })
    .command(
        'run',
        'Migrate db',
        (yargs) => {
            return yargs
                .option('connection', {
                    alias: 'c',
                    describe: 'Connection string',
                })
                .demandOption(['connection'], 'Please provide both run and path arguments to work with this tool');
        },
        (argv) => {
            return createDefaultPg(argv.connection as string)
                .init()
                .then((pg) => runMigrations({ pg, directory: argv.dir as string }))
                .then(() => {
                    console.log('Migrations has been successfully applied');
                    process.exit(0);
                })
                .catch((e) => {
                    console.error(e);
                    process.exit(1);
                });
        },
    )
    .command(
        'create [name]',
        'Create migration',
        (yargs) => {
            return yargs
                .positional('name', { describe: 'Migration name' })
                .demandOption(['name'], 'Please provide both run and path arguments to work with this tool');
        },
        (argv) => {
            const dir = argv.dir as string;
            const fileName = `${new Date().getTime()}_${argv.name}.ts`;
            const path = `${dir as string}/${fileName}`;
            const content = `import { Transaction } from '@flstk/pg';

export default async (t: Transaction) => {

};`;

            return fs
                .access(dir)
                .catch(() => fs.mkdir(dir, { recursive: true }))
                .then(() => fs.writeFile(path, content, { flag: 'w' }))
                .then(() => {
                    console.log(`Migration has been successfully created: ${path}`);
                    process.exit(0);
                })
                .catch((e) => {
                    console.error(e);
                    process.exit(1);
                });
        },
    )
    .strictCommands()
    .demandOption(['dir'], 'Please provide both run and path arguments to work with this tool')
    .help().argv;
