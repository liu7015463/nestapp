import { Type } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { omit } from 'lodash';

import { BaseRestful } from './base';
import { ApiConfig, ApiDocOption, ApiDocSource, RouteOption, SwaggerOption } from './types';
import { trimPath } from './utils';

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
}

export function genDocPath(routePath: string, prefix?: string, version?: string) {
    return trimPath(`${prefix}${version ? `/${version.toLowerCase()}/` : '/'}${routePath}`, false);
}
