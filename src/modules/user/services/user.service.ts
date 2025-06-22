import { Injectable } from '@nestjs/common';

import { isNil } from 'lodash';
import { DataSource, EntityNotFoundError, SelectQueryBuilder } from 'typeorm';

import { Configure } from '@/modules/config/configure';
import { BaseService } from '@/modules/database/base/service';

import { QueryHook } from '@/modules/database/types';

import { CreateUserDto, QueryUserDto, UpdateUserDto } from '../dtos/user.dto';
import { UserEntity } from '../entities/UserEntity';
import { UserRepository } from '../repositories/UserRepository';

@Injectable()
export class UserService extends BaseService<UserEntity, UserRepository> {
    protected enableTrash = true;

    constructor(
        protected configure: Configure,
        protected dataSource: DataSource,
        protected userRepository: UserRepository,
    ) {
        super(userRepository);
    }

    /**
     * 创建用户
     * @param data
     */
    async create(data: CreateUserDto): Promise<UserEntity> {
        const user = await this.userRepository.save(data, { reload: true });
        return this.detail(user.id);
    }

    /**
     * 更新用户
     * @param data
     */
    async update(data: UpdateUserDto): Promise<UserEntity> {
        const updated = await this.userRepository.save(data, { reload: true });
        return this.detail(updated.id);
    }

    /**
     * 根据用户用户凭证查询用户
     * @param credential
     * @param callback
     */
    async findOneByCredential(credential: string, callback?: QueryHook<UserEntity>) {
        let query = this.userRepository.buildBaseQuery();
        if (callback) {
            query = await callback(query);
        }
        return query
            .where('user.username = :credential', { credential })
            .orWhere('user.email = :credential', { credential })
            .orWhere('user.phone = :credential', { credential })
            .getOne();
    }

    /**
     * 根据对象条件查找用户,不存在则抛出异常
     * @param condition
     * @param callback
     */
    async findOneByCondition(condition: { [key: string]: any }, callback?: QueryHook<UserEntity>) {
        let query = this.userRepository.buildBaseQuery();
        if (callback) {
            query = await callback(query);
        }
        const wheres = Object.fromEntries(
            Object.entries(condition).map(([key, value]) => [key, value]),
        );
        const user = query.where(wheres).getOne();
        if (!user) {
            throw new EntityNotFoundError(UserEntity, Object.keys(condition).join(','));
        }
        return user;
    }

    protected async buildListQB(
        queryBuilder: SelectQueryBuilder<UserEntity>,
        options: QueryUserDto,
        callback?: QueryHook<UserEntity>,
    ) {
        const { orderBy } = options;
        const qb = await super.buildListQB(queryBuilder, options, callback);
        if (!isNil(orderBy)) {
            qb.orderBy(`${this.repository.qbName}.${orderBy}`, 'ASC');
        }
        return qb;
    }
}
