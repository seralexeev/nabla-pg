import { Pg } from '@flstk/pg';
import { permissionGuard } from '@flstk/rest/middlewares/authMiddleware';
import { Express } from 'express';
import { DependencyContainer } from 'tsyringe';

export const usePostgraphile = (app: Express, container: DependencyContainer) => {
    const pg = container.resolve(Pg);

    app.post('/api/graphql', permissionGuard('internal.*'), async (req, res, next) => {
        try {
            const { query, variables } = req.body;
            const data = await pg.gql(query, variables);
            res.send({ data });
        } catch (e) {
            next(e);
        }
    });
};
