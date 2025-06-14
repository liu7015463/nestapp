import { INestApplication, Injectable, Type } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { isNil, omit, trim } from 'lodash';

import { BaseRestful } from './base';
import {
    ApiConfig,
    ApiDocOption,
    ApiDocSource,
    RouteOption,
    SwaggerOption,
    VersionOption,
} from './types';
import { trimPath } from './utils';

@Injectable()
export class Restful extends BaseRestful {
    protected _docs!: { [version: string]: ApiDocOption };

    protected excludeVersionModules: string[] = [];

    get docs() {
        return this._docs;
    }

    async create(config: ApiConfig) {
        this.createConfig(config);
        await this.createRoutes();
        this.createDocs();
    }

    getModuleImports() {
        return [RouterModule.register(this.routes), ...Object.values(this.modules)];
    }

    protected getRouteDocs(
        option: Omit<SwaggerOption, 'include'>,
        routes: RouteOption[],
        parent?: string,
    ): { [key: string]: SwaggerOption } {
        const mergeDoc = (vDoc: Omit<SwaggerOption, 'include'>, route: RouteOption) => ({
            ...vDoc,
            ...route.doc,
            tags: Array.from(new Set([...(vDoc.tags ?? []), ...(route.doc?.tags ?? [])])),
            path: genDocPath(route.path, this.config.docuri, parent),
            include: this.getRouteModules([route], parent),
        });
        let routeDocs: { [key: string]: SwaggerOption } = {};
        const hasAdditional = (doc?: ApiDocSource) =>
            doc && Object.keys(omit(doc, 'tags')).length > 0;
        for (const route of routes) {
            const { name, doc, children } = route;
            const moduleName = parent ? `${parent}.${name}` : name;

            if (hasAdditional(doc) || parent) {
                this.excludeVersionModules.push(moduleName);
            }

            if (hasAdditional(doc)) {
                routeDocs[moduleName.replace(`${option.version}.`, '')] = mergeDoc(option, route);
            }
            if (children) {
                routeDocs = { ...routeDocs, ...this.getRouteDocs(option, children, moduleName) };
            }
        }
        return routeDocs;
    }

    protected filterExcludeModules(routeModules: Type<any>[]) {
        const excludeModules: Type<any>[] = [];
        const excludeNames = Array.from(new Set(this.excludeVersionModules));
        for (const [name, module] of Object.entries(this._modules)) {
            if (excludeNames.includes(name)) {
                excludeModules.push(module);
            }
        }
        return routeModules.filter(
            (module) => !excludeModules.find((emodule) => emodule === module),
        );
    }

    protected getDocOption(name: string, voption: VersionOption, isDefault = false) {
        const docConfig: ApiDocOption = {};
        const defaultDoc = {
            title: voption.title!,
            description: voption.description!,
            tags: voption.tags ?? [],
            auth: voption.auth ?? false,
            version: name,
            path: trim(`${this.config.docuri}${isDefault ? '' : `/${name}`}`, '/'),
        };

        const routesDoc = isDefault
            ? this.getRouteDocs(defaultDoc, voption.routes ?? [])
            : this.getRouteDocs(defaultDoc, voption.routes ?? [], name);
        if (Object.keys(routesDoc).length > 0) {
            docConfig.routes = routesDoc;
        }
        const routeModules = isDefault
            ? this.getRouteModules(voption.routes ?? [])
            : this.getRouteModules(voption.routes ?? [], name);
        const include = this.filterExcludeModules(routeModules);
        if (include.length > 0 || !docConfig.routes) {
            docConfig.default = { ...defaultDoc, include };
        }
        return docConfig;
    }

    protected createDocs() {
        const versionMaps = Object.entries(this.config.versions);
        const vDocs = versionMaps.map(([name, version]) => [
            name,
            this.getDocOption(name, version),
        ]);
        this._docs = Object.fromEntries(vDocs);
        const defaultVersion = this.config.versions[this._default];
        this._docs.default = this.getDocOption(this._default, defaultVersion, true);
    }

    async factoryDocs<T extends INestApplication>(
        container: T,
        metadata?: () => Promise<RecordAny>,
    ) {
        const docs = Object.values(this._docs)
            .map((doc) => [doc.default, ...Object.values(doc.routes ?? [])])
            .reduce((o, n) => [...o, ...n], [])
            .filter((i) => !!i);

        for (const voption of docs) {
            const { title, description, version, auth, include, tags } = voption!;
            const builder = new DocumentBuilder();
            if (title) {
                builder.setTitle(title);
            }
            if (description) {
                builder.setDescription(description);
            }
            if (auth) {
                builder.addBearerAuth();
            }
            if (tags) {
                tags.forEach((tag) =>
                    typeof tag === 'string'
                        ? builder.addTag(tag)
                        : builder.addTag(tag.name, tag.description, tag.externalDocs),
                );
            }
            builder.setVersion(version);

            if (!isNil(metadata)) {
                await SwaggerModule.loadPluginMetadata(metadata);
            }

            const document = SwaggerModule.createDocument(container, builder.build(), {
                include: include.length > 0 ? include : [() => undefined as any],
                ignoreGlobalPrefix: true,
                deepScanRoutes: true,
            });
            SwaggerModule.setup(voption!.path, container, document);
        }
    }
}

export function genDocPath(routePath: string, prefix?: string, version?: string) {
    return trimPath(`${prefix}${version ? `/${version.toLowerCase()}/` : '/'}${routePath}`, false);
}
