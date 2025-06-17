import { FSWatcher } from 'chokidar';

export class Asset {
    private watchAssetsKeyValue: { [key: string]: boolean } = {};

    private watchers: FSWatcher[] = [];

    private actionInProgress = false;

    closeWatchers() {}
}
