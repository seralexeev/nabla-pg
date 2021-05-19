import { ApiController } from '@flstk/rest';
import { Controller } from '@flstk/rest/controllers';

@ApiController('/users')
export class UserController implements Controller<UserController> {
    public ['GET /profile']() {
        return 'asd';
    }
}
