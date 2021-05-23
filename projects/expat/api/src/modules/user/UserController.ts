import { ServerApi, ApiController, Controller } from '@flstk/rest';
import { Body } from 'routing-controllers';

@ApiController('/users')
export class UserController implements Controller<UserController> {
    public ['GET /profile'](@Body() body: string) {
        return 'asd';
    }
}

export type UserApi = ServerApi<UserController>;
