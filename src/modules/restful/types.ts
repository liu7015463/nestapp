import { Type } from '@nestjs/common';
import { ExternalDocumentationObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export interface TagOption {
    name: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
}

export interface ApiDocSource {
    title?: string;
    description?: string;
    auth?: boolean;
    tags?: (string | TagOption)[];
}

export interface ApiConfig extends ApiDocSource {
    docuri?: string;
    default: string;
    enabled: string[];
    versions: Record<string, VersionOption>;
}

export interface VersionOption extends ApiDocSource {
    routes?: RouteOption[];
}

export interface RouteOption {
    name: string;
    path: string;
    controllers: Type<any>[];
    children?: RouteOption[];
    doc?: ApiDocSource;
}

export interface SwaggerOption extends ApiDocSource {
    version: string;
    path: string;
    include: Type<any>[];
}

export interface ApiDocOption {
    default?: SwaggerOption;
    routes?: { [key: string]: SwaggerOption };
}
