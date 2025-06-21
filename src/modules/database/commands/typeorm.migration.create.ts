/* eslint-disable @typescript-eslint/no-require-imports */
import { resolve } from 'path';

import chalk from 'chalk';

import { MigrationCreateOptions } from '@/modules/database/commands/types';

const { CommandUtils } = require('typeorm/commands/CommandUtils');
const { PlatformTools } = require('typeorm/platform/PlatformTools');
const { camelCase } = require('typeorm/util/StringUtils');

type HandleOptions = MigrationCreateOptions & { dir: string };

export class TypeormMigrationCreate {
    async handler(args: HandleOptions) {
        try {
            const timestamp = new Date().getTime();
            const directory = args.dir.startsWith('/')
                ? args.dir
                : resolve(process.cwd(), args.dir);
            const fileContent = TypeormMigrationCreate.getTemplate(args.name, timestamp);
            const fileName = `${timestamp}-${args.name}`;
            const filePath = `${directory}/${fileName}`;
            await CommandUtils.createFile(`${filePath}.ts`, fileContent);
            console.log();
            console.log(`Migration ${chalk.blue(`${filePath}.ts`)} has been created successfully.`);
        } catch (e) {
            PlatformTools.logCmdErr('Error during migration creation:', e);
            process.exit(1);
        }
    }

    protected static getTemplate(name: string, timestamp: number): string {
        return `import typeorm = require('typeorm');
        class ${camelCase(name, true)}${timestamp} implements typeorm.MigrationInterface {

    public async up(queryRunner: typeorm.QueryRunner): Promise<void> {
    }

    public async down(queryRunner: typeorm.QueryRunner): Promise<void> {
    }

}
`;
    }
}
