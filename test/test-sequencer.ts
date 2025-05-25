import path from 'path';

import { Test } from '@jest/test-result';
import TestSequencer from '@jest/test-sequencer';

export default class CustomSequencer extends TestSequencer {
    private getOrder(filePath: string): number {
        const filename = path.basename(filePath);
        const match = filename.match(/^(\d+)-/);
        return match ? parseInt(match[1], 10) : Infinity;
    }

    sort(tests: Array<Test>) {
        return [...tests].sort((a, b) => {
            return this.getOrder(a.path) - this.getOrder(b.path);
        });
    }
}
