import { createApiClient } from '@flstk/use-api';
import type { UserApi } from '@projects/expat/api/modules/user/UserController';

export const useUserApi = createApiClient<UserApi>()({
    'GET /profile': ({ get }) => {
        return () => get('/profile');
    },
});
