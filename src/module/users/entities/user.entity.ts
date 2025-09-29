import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

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

  @Column({ type: 'text', nullable: true })
  refreshTokenHash: string | null = null;

  @Column({ type: 'timestamptz', nullable: true })
  refreshTokenExpiresAt: Date | null = null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  

  @DeleteDateColumn()
  deletedAt: Date;
}
