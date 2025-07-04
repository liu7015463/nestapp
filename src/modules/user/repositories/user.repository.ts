import { BaseRepository } from '@/modules/database/base/repository';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';
import { UserEntity } from '@/modules/user/entities/user.entity';

@CustomRepository(UserEntity)
export class UserRepository extends BaseRepository<UserEntity> {
    protected _qbName: string = 'user';

    buildBaseQuery() {
        return this.createQueryBuilder(this.qbName)
            .orderBy(`${this.qbName}.createdAt`, 'DESC')
            .leftJoinAndSelect(`${this.qbName}.roles`, 'roles')
            .leftJoinAndSelect(`${this.qbName}.permissions`, 'permissions');
    }
}
