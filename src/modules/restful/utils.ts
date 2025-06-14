import { Type } from '@nestjs/common';
import { Routes, RouteTree } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ApiTags } from '@nestjs/swagger';
import chalk from 'chalk';
import { camelCase, isNil, omit, trim, upperFirst } from 'lodash';

import { Configure } from '../config/configure';

import { CreateModule } from '../core/helpers';

import { App } from '../core/types';

import { CONTROLLER_DEPENDS } from './constants';
import { Restful } from './restful';
import { ApiDocOption, RouteOption } from './types';

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

export async function echoApi(configure: Configure, container: NestFastifyApplication) {
    const appUrl = await configure.get<string>('app.url');
    const urlPrefix = await configure.get<string>('api.prefix', undefined);
    const apiUrl = isNil(urlPrefix)
        ? appUrl
        : `${appUrl}${urlPrefix.length > 0 ? `/${urlPrefix}` : urlPrefix}`;
    console.log(`- RestAPI: ${chalk.green.underline(apiUrl)}`);
    console.log('- RestDocs');
    const factory = container.get(Restful);
    const { default: defaultDoc, ...docs } = factory.docs;
    await echoApiDocs('default', defaultDoc, appUrl);
    for (const [name, doc] of Object.entries(docs)) {
        console.log();
        await echoApiDocs(name, doc, appUrl);
    }
}

export const listened: (app: App, startTime: Date) => () => Promise<void> =
    ({ configure, container }, startTime) =>
    async () => {
        console.log();
        await echoApi(configure, container);
        console.log('used time: ', chalk.cyan(`${new Date().getTime() - startTime.getTime()}`));
    };

async function echoApiDocs(name: string, doc: ApiDocOption, appUrl: string) {
    const getDocPath = (path: string) => `${appUrl}/${path}`;
    if (!doc.routes && doc.default) {
        console.log(
            `[${chalk.blue(name.toUpperCase())}]:${chalk.green.underline(
                getDocPath(doc.default.path),
            )}`,
        );
        return;
    }
    console.log(`[${chalk.blue(name.toUpperCase())}]`);
    if (doc.default) {
        console.log(`default:${chalk.green.underline(getDocPath(doc.default.path))}`);
    }
    if (doc.routes) {
        Object.entries(doc.routes).forEach(([, docs]) => {
            console.log(
                `<${chalk.yellowBright.bold(docs.title)}>: ${chalk.green.underline(
                    getDocPath(docs.path),
                )}`,
            );
        });
    }
}
