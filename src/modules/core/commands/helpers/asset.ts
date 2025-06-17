import { join } from 'path';

// eslint-disable-next-line import/no-extraneous-dependencies
import { ActionOnFile, AssetEntry } from '@nestjs/cli/lib/configuration';
import chokidar, { FSWatcher } from 'chokidar';

import { get } from 'lodash';

import { CLIConfig } from '@/modules/core/commands/types';
import { toBoolean } from '@/modules/core/helpers';

export class Asset {
    private watchAssetsKeyValue: { [key: string]: boolean } = {};

    private watchers: FSWatcher[] = [];

    private actionInProgress = false;

    closeWatchers() {
        const timeout = 500;
        const closeFn = () => {
            if (this.actionInProgress) {
                this.actionInProgress = false;
                setTimeout(closeFn, timeout);
            } else {
                this.watchers.forEach((watch) => watch.close());
            }
        };
        setTimeout(closeFn, timeout);
    }

    watchAssets(config: CLIConfig, codePath: string, changer: () => void) {
        const assets = get(config.options.nest, 'compilerOptions.assets', []) as AssetEntry[];

        if (assets.length <= 0) {
            return;
        }

        try {
            const isWatchEnabled = toBoolean(get(config, 'watchAssets', 'src'));
            const filesToWatch = assets.map<AssetEntry>((item) => {
                if (typeof item === 'string') {
                    return {
                        glob: join(codePath, item),
                    };
                }
                return {
                    glob: join(codePath, item.include!),
                    exclude: item.exclude ? join(codePath, item.exclude) : undefined,
                    flat: item.flat,
                    watchAssets: item.watchAssets,
                };
            });

            for (const file of filesToWatch) {
                const option: ActionOnFile = {
                    action: 'change',
                    item: file,
                    path: '',
                    sourceRoot: codePath,
                    watchAssetsMode: isWatchEnabled,
                };

                const watcher = chokidar
                    .watch(file.glob, { ignored: file.exclude })
                    .on('add', (path) =>
                        this.actionOnFIle({ ...option, path, action: 'change' }, changer),
                    )
                    .on('change', (path) =>
                        this.actionOnFIle({ ...option, path, action: 'change' }, changer),
                    )
                    .on('unlink', (path) =>
                        this.actionOnFIle({ ...option, path, action: 'unlink' }, changer),
                    );
                this.watchers.push(watcher);
            }
        } catch (e) {
            throw new Error(
                `An error occurred during the assets copying process. ${(e as any).message}`,
            );
        }
    }

    protected actionOnFIle(option: ActionOnFile, changer: () => void) {
        const { action, item, path, watchAssetsMode } = option;
        const isWatchEnabled = watchAssetsMode || item.watchAssets;

        if (!isWatchEnabled && this.watchAssetsKeyValue[path]) {
            return;
        }
        this.watchAssetsKeyValue[path] = true;
        this.actionInProgress = true;
        if (action === 'change') {
            changer();
        }
    }
}
