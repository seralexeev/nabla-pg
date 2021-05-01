import { createDefaultPg } from '@flstk/pg';
import { makeError } from '@flstk/result';
import { json } from 'body-parser';
import cors from 'cors';
import express from 'express';

const pg = createDefaultPg('postgres://flstk:flstk@localhost:5432/flstk');

const app = express();

app.use(cors());
app.use(json());

app.post('/api/graphql', async (req, res, next) => {
    try {
        const { query, variables } = req.body;
        const data = await pg.gql(query, variables);

        res.send({ data });
    } catch (error) {
        res.status(400).send(makeError('GQL_ERROR', error.message, { error }));
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
