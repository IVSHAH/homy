import { DataSource } from "typeorm";
import { User } from '../module/user/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: +process.env.DB_PORT!,
    synchronize: true,
    entities: [User],
    migrations: [],
    migrationsRun: false,

})