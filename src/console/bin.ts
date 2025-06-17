import { createApp } from '@/modules/core/helpers/app';
import { buildCli } from '@/modules/core/helpers/command';
import { createOptions } from '@/options';

buildCli(createApp(createOptions));
