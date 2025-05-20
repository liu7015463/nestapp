import {
    ClassSerializerContextOptions,
    ClassSerializerInterceptor,
    PlainLiteralObject,
    StreamableFile,
} from '@nestjs/common';
import { isArray, isNil, isObject } from 'lodash';

export class AppInterceptor extends ClassSerializerInterceptor {
    serialize(
        response: PlainLiteralObject | Array<PlainLiteralObject>,
        options: ClassSerializerContextOptions,
    ): PlainLiteralObject | Array<PlainLiteralObject> {
        if ((!isObject(response) && !isArray(response)) || response instanceof StreamableFile) {
            return response;
        }

        if (isArray(response)) {
            return (response as PlainLiteralObject[]).map((item) => {
                return !isObject(item) ? item : this.transformToPlain(item, options);
            });
        }

        if ('meta' in response && 'items' in response) {
            const items = !isNil(response.items) && isArray(response.items) ? response.items : [];
            return {
                ...response,
                items: (items as PlainLiteralObject[]).map((item) => {
                    return isObject(item) ? this.transformToPlain(item, options) : item;
                }),
            };
        }
        return super.transformToPlain(response, options);
    }
}
