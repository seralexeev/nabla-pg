import fastify from 'fastify';
import { Pool } from 'pg';
import { createPg } from '../../nabla-pg-core/src';
import { createSchema } from '../../nabla-pg-core/src/gql';

const connectionString = 'postgres://nabla:nabla@localhost:5433/nabla_db';

const createApp = async () => {
    const pool = new Pool({ connectionString });
    const pg = createPg(pool, await createSchema(connectionString));

    const app = fastify({
        logger: true,
    });

    app.post('/graphql', async (req, res) => {
        const { query, variables } = req.body as any;
        const data = await pg.gql(query)({ variables });
        res.send({ data });
    });

    return app;
};

createApp().then((app) =>
    app.listen(3000, (err, address) => {
        if (err) {
            throw err;
        }

        app.log.info(`server listening on ${address}`);
    }),
);
