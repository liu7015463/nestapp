import { createApp } from '@/modules/core/helpers/app';
import { buildCli } from '@/modules/core/helpers/command';
import { createOptions } from '@/options';

console.error('Raw argv:', process.argv);
console.log('This is the very beginning of bin.ts');

buildCli(createApp(createOptions));
