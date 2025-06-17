import { ConfigureFactory, ConfigureRegister } from '../config/types';
import { createConnectionOptions } from '../config/utils';

import type { MeiliConfig } from './types';

export const createMeiliConfig: (
    registre: ConfigureRegister<RePartial<MeiliConfig>>,
) => ConfigureFactory<MeiliConfig, MeiliConfig> = (register) => ({
    register,
    hook: (configure, value) => createConnectionOptions(value),
});
