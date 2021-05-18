import { createApiClient } from '@flstk/use-api';
// import { UserApi } from '@projects/expat/shared/api';

const api = createApiClient<UserApi>({
    'GET /profile': () => get('/migrations'),
});
