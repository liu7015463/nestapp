import path from 'path';

import { Configure } from '@/modules/config/configure';
import { SmtpOptions } from '@/modules/core/types';

export const smtp: (configure: Configure) => SmtpOptions = (configure) => ({
    host: configure.env.get('SMTP_HOST', 'localhost'),
    user: configure.env.get('SMTP_USER', 'test'),
    password: configure.env.get('SMTP_PASSWORD', ''),
    from: configure.env.get('SMTP_FROM', '平克小站<support@localhost>'),
    port: configure.env.get('SMTP_PORT', (v) => Number(v), 25),
    secure: configure.env.get('SMTP_SSL', (v) => JSON.parse(v), false),
    // Email模板路径
    resource: path.resolve(__dirname, '../../assets/emails'),
});
