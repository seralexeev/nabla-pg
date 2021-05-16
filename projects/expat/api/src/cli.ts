import 'reflect-metadata';

import { buildGqlSchema } from '@projects/expat/api/modules/graphql/schema';
import { promises as fs } from 'fs';
import { printSchema } from 'graphql';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

yargs(hideBin(process.argv))
    .command(
        'emit_gql',
        'Generate gql schema',
        (yargs) => yargs,
        () => {
            return buildGqlSchema().then((schema) => {
                const content = printSchema(schema);
                fs.writeFile('../shared/src/graphql/schema.gql', content, { flag: 'w' });
            });
        },
    )
    .strictCommands()
    .help().argv;
