/* eslint-disable @typescript-eslint/no-require-imports */
import { resolve } from 'path';

import chalk from 'chalk';
import { upperFirst } from 'lodash';
import { format } from 'mysql2';
import { DataSource } from 'typeorm';

import { MigrationGenerateOptions } from '@/modules/database/commands/types';

const { CommandUtils } = require('typeorm/commands/CommandUtils');
const { PlatformTools } = require('typeorm/platform/PlatformTools');
const { camelCase } = require('typeorm/util/StringUtils');

type HandlerOptions = MigrationGenerateOptions & { dataSource: DataSource } & { dir: string };

export class TypeormMigrationGenerate {
    async handler(args: HandlerOptions) {
        const timestamp = new Date().getTime();
        const fileExt = '.ts';
        const directory = args.dir.startsWith('/') ? args.dir : resolve(process.cwd(), args.dir);
        const filename = `${timestamp}-${args.name}`;
        const filePath = `${directory}/${filename}${fileExt}`;
        const { dataSource } = args;

        try {
            dataSource.setOptions({
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: false,
            });
            await dataSource.initialize();
            const upSqls: string[] = [];
            const downSqls: string[] = [];

            try {
                const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();
                if (args.pretty) {
                    sqlInMemory.upQueries.forEach((upSql) => {
                        upSql.query = TypeormMigrationGenerate.prettifyQuery(upSql.query);
                    });
                    sqlInMemory.downQueries.forEach((downSql) => {
                        downSql.query = TypeormMigrationGenerate.prettifyQuery(downSql.query);
                    });
                }
                sqlInMemory.upQueries.forEach((upQuery) => {
                    upSqls.push(
                        `        await queryRunner.query(\`${upQuery.query.replace(
                            /`/g,
                            '\\`',
                        )}\`${TypeormMigrationGenerate.queryParams(upQuery.parameters)});`,
                    );
                });
                sqlInMemory.downQueries.forEach((downQuery) => {
                    downSqls.push(
                        `        await queryRunner.query(\`${downQuery.query.replace(
                            /`/g,
                            '\\`',
                        )}\`${TypeormMigrationGenerate.queryParams(downQuery.parameters)});`,
                    );
                });
            } finally {
                await dataSource.destroy();
            }

            if (!upSqls.length) {
                console.log(chalk.green(`No changes in database schema were found`));
                process.exit(0);
            }

            const fileContent = TypeormMigrationGenerate.getTemplate(
                args.name,
                timestamp,
                upSqls,
                downSqls.reverse(),
            );
            if (args.check) {
                console.log(
                    chalk.yellow(
                        `Unexpected changes in database schema were found in check mode:\n\n${chalk.white(
                            fileContent,
                        )}`,
                    ),
                );
                process.exit(1);
            }

            if (args.dryrun) {
                console.log(
                    chalk.green(
                        `Migration ${chalk.blue(
                            filePath,
                        )} has content:\n\n${chalk.white(fileContent)}`,
                    ),
                );
            } else {
                await CommandUtils.createFile(filePath, fileContent);
                console.log();
                console.log(
                    chalk.green(
                        `Migration ${chalk.blue(filePath)} has been generated successfully.`,
                    ),
                );
            }
        } catch (e) {
            PlatformTools.logCmdErr('Error during migration generation:', e);
            process.exit(1);
        }
    }

    protected static queryParams(params: any[] | undefined): string {
        if (!params || !params.length) {
            return '';
        }
        return `,${JSON.stringify(params)}`;
    }

    protected static prettifyQuery(query: string) {
        const formatQuery = format(query, { indent: '    ' });
        return `\n${formatQuery.replace(/^/gm, '        ')}\n    `;
    }

    protected static getTemplate(
        name: string,
        timestamp: number,
        upSqls: string[],
        downSqls: string[],
    ): string {
        const migrationName = `${camelCase(upperFirst(name), true)}${timestamp}`;

        return `import typeorm = require('typeorm');

class ${migrationName} implements typeorm.MigrationInterface {
    name = '${migrationName}'

    public async up(queryRunner: typeorm.QueryRunner): Promise<void> {
${upSqls.join(`
`)}
    }

    public async down(queryRunner: typeorm.QueryRunner): Promise<void> {
${downSqls.join(`
`)}
    }

}

module.exports = ${migrationName}
`;
    }
}
