import { Type } from '@nestjs/common';
import { Routes, RouteTree } from '@nestjs/core';
import { ApiTags } from '@nestjs/swagger';
import { camelCase, isNil, omit, trim, upperFirst } from 'lodash';

import { Configure } from '../config/configure';

import { CreateModule } from '../core/helpers';

import { CONTROLLER_DEPENDS } from './constants';
import { RouteOption } from './types';

export const trimPath = (routePath: string, addPrefix = true) =>
    `${addPrefix ? '/' : ''}${trim(routePath.replace('//', '/'), '/')}`;

export const getCleanRoutes = (data: RouteOption[]): RouteOption[] =>
    data.map((option) => {
        const route: RouteOption = {
            ...omit(option, 'children'),
            path: trimPath(option.path),
        };
        if (option.children && option.children.length > 0) {
            route.children = getCleanRoutes(option.children);
        } else {
            delete route.children;
        }
        return route;
    });

export function getRoutePath(routePath: string, prefix?: string, version?: string) {
    const addVersion = `${version ? `/${version.toLowerCase()}/` : '/'}${routePath}`;
    return isNil(prefix) ? trimPath(addVersion) : trimPath(`${prefix}${addVersion}`);
}

export function createRouteModuleTree(
    configure: Configure,
    modules: { [key: string]: Type<any> },
    routes: RouteOption[],
    parentModule?: string,
): Promise<Routes> {
    return Promise.all(
        routes.map(async ({ name, path, children, controllers, doc }) => {
            const moduleName = parentModule ? `${parentModule}.${name}` : name;
            if (Object.keys(modules).includes(moduleName)) {
                throw new Error(
                    `route name must be unique in same level, ${moduleName} has exists`,
                );
            }
            const depends = controllers
                .map((o) => Reflect.getMetadata(CONTROLLER_DEPENDS, o) || [])
                .reduce((o: Type<any>[], n) => [...o, ...n], [])
                .reduce((o: Type<any>[], n: Type<any>) => {
                    if (o.find((i) => i === n)) {
                        return o;
                    }
                    return [...o, n];
                }, []);

            if (doc?.tags && doc.tags.length > 0) {
                controllers.forEach((o) => {
                    !Reflect.getMetadata('swagger/apiUseTags', o) &&
                        ApiTags(
                            ...doc.tags.map((tag) => (typeof tag === 'string' ? tag : tag.name)),
                        )(o);
                });
            }

            const module = CreateModule(`${upperFirst(camelCase(name))}RouteModule`, () => ({
                controllers,
                imports: depends,
            }));

            modules[moduleName] = module;
            const route: RouteTree = { path, module };
            if (children) {
                route.children = await createRouteModuleTree(
                    configure,
                    modules,
                    children,
                    moduleName,
                );
            }
            return route;
        }),
    );
}
