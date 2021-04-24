import { Controller } from '@flstk/rest/controller';
import { Body } from '@flstk/rest/decorators';

export class UserController implements Controller<UserController> {
    public ['GET /users'](@Body() body: string) {
        return 'a';
    }
}
