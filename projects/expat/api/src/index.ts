import { ConfigLoader } from '@flstk/config';
import { createDefaultPg } from '@flstk/pg';
import { pick } from '@flstk/utils';
import { defaultConfig } from '@projects/expat/api/config/default';
import { Migrations } from '@projects/expat/api/entities/generated';
import cors from 'cors';
import express from 'express';
import { Pool } from 'pg';

const { config } = new ConfigLoader(['dev', 'prod'], defaultConfig).load();
const pool = new Pool(pick(config.pg, ['database', 'host', 'port', 'user', 'password']));
const pg = createDefaultPg(pool);

const app = express();

app.use(express.json());
app.use(cors());
app.get('/test', (req, res) => {
    Migrations.find(pg, {
        selector: ['name', 'migratedAt'],
    }).then((x) => res.json(x));
});

app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
});
