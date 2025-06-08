import { ConfigureFactory, ConfigureRegister } from '../config/types';

import { ContentConfig } from './types';

export const defauleContentConfig: ContentConfig = { searchType: 'mysql', htmlEnabled: false };

export const createContentConfig: (
    register: ConfigureRegister<RePartial<ContentConfig>>,
) => ConfigureFactory<ContentConfig> = (register) => ({
    register,
    defaultRegister: () => defauleContentConfig,
});
