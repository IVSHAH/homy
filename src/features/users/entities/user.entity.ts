import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { RefreshToken } from '../../../auth/entities/refresh-token.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  login: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'int' })
  age: number;

  @Column({ length: 1000, nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => RefreshToken, (token: RefreshToken) => token.user)
  refreshTokens: RefreshToken[];
}
