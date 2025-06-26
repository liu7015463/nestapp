import { SetMetadata } from '@nestjs/common';

import { PERMISSION_CHECKERS } from '../constants';
import { PermissionChecker } from '../types';

export const Permision = (...checkers: PermissionChecker[]) =>
    SetMetadata(PERMISSION_CHECKERS, checkers);
