import dayjs from 'dayjs';

import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import localeData from 'dayjs/plugin/localeData';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { Configure } from '@/modules/config/configure';
import { AppConfig, TimeOptions } from '@/modules/core/types';

dayjs.extend(localeData);
dayjs.extend(utc);
dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(dayOfYear);
dayjs.extend(timezone);

/**
 * 获取一个dayjs时间对象
 * @param configure
 * @param options
 */
export async function getTime(configure: Configure, options?: TimeOptions) {
    const { date, format, locale, strict, zonetime } = options ?? {};
    const config = await configure.get<AppConfig>('app');
    const now = dayjs(date, format, locale ?? config.locale, strict).clone();
    return now.tz(zonetime ?? config.timezone);
}
