import { resolve } from 'path';

import chalk from 'chalk';
import { CommandUtils } from 'typeorm/commands/CommandUtils';
import { PlatformTools } from 'typeorm/platform/PlatformTools';
import { camelCase } from 'typeorm/util/StringUtils';

import { MigrationCreateOptions } from '@/modules/database/commands/types';

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
            console.log(
                `Migration ${chalk.blue(`${filePath}.ts`)} has been generated successfully.`,
            );
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
