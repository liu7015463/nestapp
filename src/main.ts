import { createApp, listened, startApp } from './modules/core/helpers/app';
import { createOptions } from './options';

startApp(createApp(createOptions), listened);
