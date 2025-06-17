import { DemoCommandArguments } from '@/modules/core/commands/types';
import { CommandItem } from '@/modules/core/types';

export const DemoCommand: CommandItem<any, DemoCommandArguments> = async (app) => ({
    command: ['demo', 'd'],
    describe: 'a demo command',
    handler: async (args: DemoCommandArguments) => {
        const { configure } = app;
        const appName = await configure.get<string>('app.name');
        const sleep = args.sleep ? ' will to sleep' : '';
        console.log(`just a demo command,app ${appName} ${sleep}`);
    },
    builder: {
        sleep: {
            type: 'boolean',
            alias: 's',
            describe: 'App will sleep ?',
            default: false,
        },
    },
});
