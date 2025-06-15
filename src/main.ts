import 'reflect-metadata';

import { createApp, startApp } from './modules/core/helpers/app';
import { listened } from './modules/restful/utils';
import { createOptions } from './options';

startApp(createApp(createOptions), listened);
