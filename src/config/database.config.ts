import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const database = (): TypeOrmModuleOptions => ({
    charset: 'utf8mb4',
    logging: ['error'],
    type: 'mysql',
    host: '192.168.50.26',
    port: 3306,
    username: '3r',
    password: '12345678',
    database: '3r',
    synchronize: true,
    autoLoadEntities: true,
    timezone: '+08:00',
});
