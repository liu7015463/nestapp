import { createUserConfig } from '@/modules/user/config';

export const user = createUserConfig(() => ({
    hash: 10,
}));
