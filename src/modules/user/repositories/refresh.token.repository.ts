import { SelectQueryBuilder } from 'typeorm';

import { BaseRepository } from '@/modules/database/base/repository';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';
import { RefreshTokenEntity } from '@/modules/user/entities';

@CustomRepository(RefreshTokenEntity)
export class RefreshTokenRepository extends BaseRepository<RefreshTokenEntity> {
    protected _qbName: string = 'refreshToken';

    buildBaseQB(): SelectQueryBuilder<RefreshTokenEntity> {
        return super.createQueryBuilder(this.qbName).orderBy(`${this.qbName}.createdAt`, 'DESC');
    }
}
