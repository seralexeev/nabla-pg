import { Controller } from '@nabla/rest/controller';
import { Body } from '@nabla/rest/decorators';

export class UserController implements Controller<UserController> {
    public ['GET /users'](@Body() body: string) {
        return 'a';
    }
}
