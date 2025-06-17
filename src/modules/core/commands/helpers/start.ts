import { isNil } from '@nestjs/common/utils/shared.utils';
import { Subprocess } from 'bun';
import chalk from 'chalk';
import { pick } from 'lodash';
import {
    connect as pm2Connect,
    disconnect as pm2Disconnect,
    restart as pm2Restart,
    start as pm2Start,
} from 'pm2';
import { Arguments } from 'yargs';

import { Configure } from '@/modules/config/configure';
import { getPm2Config } from '@/modules/core/commands/helpers/config';
import { CLIConfig, StartCommandArguments } from '@/modules/core/commands/types';
import { AppConfig } from '@/modules/core/types';

export async function start(
    args: Arguments<StartCommandArguments>,
    config: CLIConfig,
): Promise<void> {
    const script = args.typescript ? config.paths.ts : config.paths.js;
    const params = [config.paths.bun, 'run'];
    if (args.watch) {
        params.push('--watch');
    }
    if (args.debug) {
        const inspectFlag =
            typeof args.debug === 'string' ? `--inspect=${args.debug}` : '--inspect';
        params.push(inspectFlag);
    }
    params.push(script);
    let child: Subprocess;
    if (args.watch) {
        const restart = () => {
            if (!isNil(child)) {
                child.kill();
            }
            child = Bun.spawn(params, config.subprocess.bun);
        };
        restart();
    } else {
        Bun.spawn(params, {
            ...config.subprocess.bun,
            onExit(proc) {
                proc.kill();
                process.exit(0);
            },
        });
    }
}

export async function startPM2(
    configure: Configure,
    args: Arguments<StartCommandArguments>,
    config: CLIConfig,
): Promise<void> {
    const { name } = await configure.get<AppConfig>('app');
    const script = args.typescript ? config.paths.ts : config.paths.js;
    const pm2config = await getPm2Config(
        configure,
        { command: 'start', ...pick(args, ['watch', 'typescript']) },
        config,
        script,
    );

    if (pm2config.exec_mode === 'cluster' && args.typescript) {
        console.log(
            chalk.yellowBright(
                'Cannot directly use bun to run ts code in cluster mode, so it will automatically change to fork mode.',
            ),
        );
        console.log();
        console.log(
            chalk.bgCyanBright(
                chalk.blackBright(
                    'If you really need the app to be started in cluster mode, be sure to compile it into js first, and then add the --no-ts arg when running',
                ),
            ),
        );
        console.log();
        pm2config.exec_mode = 'fork';
    }

    const connectCallback = (error?: any) => {
        if (!isNil(error)) {
            console.error(error);
            process.exit(2);
        }
    };

    const startCallback = (error?: any) => {
        if (!isNil(error)) {
            console.error(error);
            process.exit(1);
        }
        pm2Disconnect();
    };

    const restartCallback = (error?: any) => {
        if (isNil(error)) {
            pm2Disconnect();
        } else {
            pm2Start(pm2config, (err) => startCallback(err));
        }
    };

    pm2Connect((err: any) => {
        connectCallback(err);
        args.restart
            ? pm2Restart(name, restartCallback)
            : pm2Start(pm2config, (e) => startCallback(e));
    });
}
