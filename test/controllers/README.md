# Controller Tests

这个目录包含了NestJS应用程序中所有controller的完整测试用例。每个controller都有独立的测试文件，覆盖了所有的API接口和各种测试场景。

## 📁 测试文件结构

```
test/controllers/
├── README.md                           # 本文件
├── category.controller.test.ts         # 分类查询API测试
├── tag.controller.test.ts              # 标签查询API测试
├── post.controller.test.ts             # 文章操作API测试
├── comment.controller.test.ts          # 评论操作API测试
├── user.controller.test.ts             # 用户查询API测试
├── account.controller.test.ts          # 账户操作API测试
├── role.controller.test.ts             # 角色查询API测试
└── manager/                            # 管理后台API测试
    ├── category.controller.test.ts     # 分类管理API测试
    ├── tag.controller.test.ts          # 标签管理API测试
    ├── post.controller.test.ts         # 文章管理API测试
    ├── comment.controller.test.ts      # 评论管理API测试
    ├── user.controller.test.ts         # 用户管理API测试
    ├── role.controller.test.ts         # 角色管理API测试
    └── permission.controller.test.ts   # 权限管理API测试
```

## 🧪 测试覆盖范围

每个测试文件都包含以下类型的测试用例：

### ✅ 成功场景测试
- 正常的API调用和响应
- 有效的参数和数据
- 正确的权限验证

### ❌ 失败场景测试
- 参数验证失败
- 权限验证失败
- 数据不存在
- 业务逻辑错误

### 🔍 边界值测试
- 最大/最小值测试
- 空值和null值测试
- 特殊字符测试
- 长度限制测试

### 🔐 权限测试
- 未认证访问
- 权限不足
- Token验证

## 🚀 运行测试

### 运行所有controller测试
```bash
npm run test:controllers
```

### 运行特定的测试文件
```bash
# 运行分类controller测试
npm run test:controllers category

# 运行用户相关测试
npm run test:controllers user account

# 运行管理后台测试
npm run test:controllers manager
```

### 运行测试组
```bash
# 运行所有前台API测试
npm run test:controllers app

# 运行所有管理后台API测试
npm run test:controllers manager

# 运行所有内容相关测试
npm run test:controllers content

# 运行所有用户认证相关测试
npm run test:controllers user-auth

# 运行所有权限相关测试
npm run test:controllers rbac
```

### 使用Jest直接运行
```bash
# 运行单个测试文件
npx jest test/controllers/category.controller.test.ts

# 运行所有controller测试
npx jest test/controllers/

# 运行测试并生成覆盖率报告
npx jest test/controllers/ --coverage

# 运行测试并监听文件变化
npx jest test/controllers/ --watch
```

## 📊 测试报告

测试运行后会生成以下报告：

### 控制台输出
- 测试执行摘要
- 失败测试详情
- 性能统计
- 覆盖率摘要

### HTML报告
- 位置：`coverage/controllers/test-report.html`
- 包含详细的测试结果和覆盖率信息

### JSON报告
- 位置：`coverage/controllers/test-results.json`
- 机器可读的测试结果数据

### 覆盖率报告
- 位置：`coverage/controllers/lcov-report/index.html`
- 详细的代码覆盖率分析

## 🛠️ 测试配置

### Jest配置
测试使用专门的Jest配置文件：`test/jest.controller.config.js`

### 环境变量
测试运行时会使用以下环境变量：
```bash
NODE_ENV=test
APP_PORT=3001
TEST_DB_HOST=localhost
TEST_DB_PORT=3306
TEST_DB_DATABASE=nestapp_test
TEST_DB_USERNAME=root
TEST_DB_PASSWORD=
```

### 测试数据库
- 测试使用独立的测试数据库
- 每个测试都会创建和清理自己的测试数据
- 不会影响开发或生产数据

## 📝 编写新的测试

### 测试文件模板
```typescript
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';
import { createApp } from '@/modules/core/helpers/app';
import { App } from '@/modules/core/types';
import { createOptions } from '@/options';

const URL_PREFIX = '/api/v1/your-module';

describe('YourController', () => {
    let datasource: DataSource;
    let app: NestFastifyApplication;
    let testData: any[];

    beforeAll(async () => {
        const appConfig: App = await createApp(createOptions)();
        app = appConfig.container;
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        datasource = app.get<DataSource>(DataSource);
        
        if (!datasource.isInitialized) {
            await datasource.initialize();
        }

        await setupTestData();
    });

    afterAll(async () => {
        await cleanupTestData();
        await datasource.destroy();
        await app.close();
    });

    async function setupTestData() {
        // 创建测试数据
    }

    async function cleanupTestData() {
        // 清理测试数据
    }

    describe('GET /endpoint', () => {
        it('should return success response', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${URL_PREFIX}/endpoint`,
            });

            expect(result.statusCode).toBe(200);
            // 添加更多断言
        });
    });
});
```

### 测试数据生成
使用 `test/helpers/test-data-generator.ts` 中的工具函数：

```typescript
import { 
    generateTestUser, 
    generateTestCategory,
    TestDataManager 
} from '../helpers/test-data-generator';

const dataManager = new TestDataManager();

// 生成测试用户
const testUser = generateTestUser('mytest');

// 生成测试分类
const testCategory = generateTestCategory('MyTestCategory');

// 添加清理任务
dataManager.getCleaner().addCleanupTask(async () => {
    await userRepository.remove(testUser);
});
```

## 🔧 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查测试数据库是否存在
   - 确认数据库连接配置正确

2. **测试超时**
   - 增加Jest超时时间
   - 检查是否有未关闭的数据库连接

3. **权限测试失败**
   - 确认测试用户有正确的权限
   - 检查认证token是否有效

4. **测试数据冲突**
   - 确保每个测试使用独立的测试数据
   - 检查测试数据清理是否完整

### 调试技巧

1. **启用详细日志**
   ```bash
   DISABLE_TEST_LOGS=false npm run test:controllers
   ```

2. **运行单个测试**
   ```bash
   npx jest test/controllers/category.controller.test.ts --verbose
   ```

3. **使用调试器**
   ```bash
   node --inspect-brk node_modules/.bin/jest test/controllers/category.controller.test.ts --runInBand
   ```

## 📚 相关文档

- [Jest官方文档](https://jestjs.io/docs/getting-started)
- [NestJS测试文档](https://docs.nestjs.com/fundamentals/testing)
- [Fastify测试文档](https://www.fastify.io/docs/latest/Guides/Testing/)

## 🤝 贡献指南

1. 为新的controller添加对应的测试文件
2. 确保测试覆盖所有的API接口
3. 包含成功和失败场景的测试用例
4. 使用独立的测试数据，避免测试间的相互影响
5. 添加适当的注释和文档
