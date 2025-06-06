import { NestFactory } from '@nestjs/core';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { useContainer } from 'class-validator';

import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
        cors: true,
        logger: ['error', 'warn'],
    });
    app.setGlobalPrefix('api');
    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    await app.listen(process.env.PORT ?? 3000, () => {
        console.log('api: http://localhost:3000');
    });
}

bootstrap();
