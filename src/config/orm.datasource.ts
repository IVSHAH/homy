import { DataSource } from 'typeorm';
import { User } from '../module/users/entities/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT ?? 5432),
  synchronize: true,
  entities: [User],
  migrations: [],
  migrationsRun: false,
});
