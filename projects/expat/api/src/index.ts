import { ConfigLoader } from '@flstk/config';
import { createDefaultPg } from '@flstk/pg';
import { defaultConfig } from '@projects/expat/api/config/default';
import cors from 'cors';
import express from 'express';

const { config } = new ConfigLoader(['dev', 'prod'], defaultConfig).load();

const app = express();

app.use(express.json());
app.use(cors());
app.get('/test', (req, res) => {});

app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
});
