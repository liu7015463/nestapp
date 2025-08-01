import { Configure } from '@/modules/config/configure';
import { SmsOptions } from '@/modules/core/types';

export const sms: (configure: Configure) => SmsOptions = (configure) => ({
    sign: configure.env.get('SMS_CLOUD_SING', 'liuyi'),
    region: configure.env.get('SMS_CLOUD_REGION', 'ap-guangzhou'),
    appid: configure.env.get('SMS_CLOUD_APPID', 'app-id'),
    secretId: configure.env.get('SMS_CLOUD_ID', 'your-secret-id'),
    secretKey: configure.env.get('SMS_CLOUD_KEY', 'your-secret-key'),
});
