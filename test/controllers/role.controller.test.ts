import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';

import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';
import { RoleEntity } from '@/modules/rbac/entities';
import { RoleRepository } from '@/modules/rbac/repositories';

import { createOptions } from '@/options';

const URL_PREFIX = '/api/v1/rbac';

describe('RoleController (App)', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let roleRepository: RoleRepository;
    let testRoles: RoleEntity[];

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        roleRepository = app.get<RoleRepository>(RoleRepository);
        datasource = app.get<DataSource>(DataSource);

        if (!datasource.isInitialized) {
            await datasource.initialize();
        }

        // 创建测试数据
        await setupTestData();
    });

    afterAll(async () => {
        // 清理测试数据
        await cleanupTestData();
        await datasource.destroy();
        await app.close();
    });

    async function setupTestData() {
        // 创建测试角色数据
        const role1 = await roleRepository.save({
            name: 'Test Role 1',
            label: 'test-role-1',
            description: 'Test role description 1',
        });

        const role2 = await roleRepository.save({
            name: 'Test Role 2',
            label: 'test-role-2',
            description: 'Test role description 2',
        });

        const role3 = await roleRepository.save({
            name: 'Test Role 3',
            label: 'test-role-3',
        });

        testRoles = [role1, role2, role3];
    }

    async function cleanupTestData() {
        if (testRoles && testRoles.length > 0) {
            await roleRepository.remove(testRoles);
        }
    }

    describe('GET /roles', () => {
        it('should return paginated roles successfully', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.items).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(Array.isArray(response.items)).toBe(true);
        });

        it('should return roles with valid pagination parameters', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles?page=1&limit=5`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.meta.currentPage).toBe(1);
            expect(response.meta.perPage).toBe(5);
        });

        it('should filter roles by trashed status', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles?trashed=none`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(Array.isArray(response.items)).toBe(true);
        });

        it('should fail with invalid page parameter', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles?page=0`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The current page must be greater than 1.');
        });

        it('should fail with invalid limit parameter', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles?limit=0`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain(
                'The number of data displayed per page must be greater than 1.',
            );
        });

        it('should handle negative page numbers', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles?page=-1`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('The current page must be greater than 1.');
        });

        it('should handle large page numbers gracefully', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles?page=999999`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            expect(response.items).toEqual([]);
        });

        it('should return roles with correct structure', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles?limit=1`,
            });

            expect(result.statusCode).toBe(200);
            const response = result.json();
            const role = response.items[0];
            expect(role.id).toBeDefined();
            expect(role.name).toBeDefined();
            expect(role.label).toBeDefined();
            expect(typeof role.name).toBe('string');
            expect(typeof role.label).toBe('string');
        });
    });

    describe('GET /roles/:id', () => {
        it('should return role detail successfully', async () => {
            const role = testRoles[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles/${role.id}`,
            });

            expect(result.statusCode).toBe(200);
            const roleDetail = result.json();
            expect(roleDetail.id).toBe(role.id);
            expect(roleDetail.name).toBe(role.name);
            expect(roleDetail.label).toBe(role.label);
            expect(roleDetail.description).toBe(role.description);
        });

        it('should return role without description if not set', async () => {
            const roleWithoutDesc = testRoles.find((r) => !r.description);

            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles/${roleWithoutDesc.id}`,
            });

            expect(result.statusCode).toBe(200);
            const roleDetail = result.json();
            expect(roleDetail.id).toBe(roleWithoutDesc.id);
            expect(roleDetail.name).toBe(roleWithoutDesc.name);
            expect(roleDetail.label).toBe(roleWithoutDesc.label);
        });

        it('should fail with invalid UUID format', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles/invalid-uuid`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('Validation failed (uuid is expected)');
        });

        it('should fail with non-existent role ID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles/74e655b3-b69a-42ae-a101-41c224386e74`,
            });
            console.log(result.json());
            expect(result.statusCode).toBe(404);
        });

        it('should handle empty UUID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles/`,
            });

            expect(result.statusCode).toBe(400);
        });

        it('should handle malformed UUID', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles/not-a-uuid-at-all`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('Validation failed (uuid is expected)');
        });

        it('should handle UUID with wrong format', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles/12345678-1234-1234-1234-123456789012345`,
            });

            expect(result.statusCode).toBe(400);
            expect(result.json().message).toContain('Validation failed (uuid is expected)');
        });

        it('should return role with permissions if available', async () => {
            const role = testRoles[0];
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/roles/${role.id}`,
            });

            expect(result.statusCode).toBe(200);
            const roleDetail = result.json();
            // 权限字段应该存在（即使为空）
            expect(roleDetail.permissions).toBeDefined();
        });
    });
});
