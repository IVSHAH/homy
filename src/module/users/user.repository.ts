import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, SelectQueryBuilder } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { login, deletedAt: IsNull() },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
    });
  }

  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    loginFilter?: string
  ): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.createQueryBuilder().skip(skip).take(limit);

    if (loginFilter) {
      queryBuilder.andWhere('user.login ILIKE :login', { login: `%${loginFilter}%` });
    }

    const [users, total] = await queryBuilder.getManyAndCount();
    return { users, total };
  }

  async update(id: number, updateData: Partial<User>): Promise<void> {
    await this.userRepository.update(id, updateData);
  }

  async softDelete(id: number): Promise<void> {
    await this.userRepository.softDelete(id);
  }

  async restore(id: number): Promise<void> {
    await this.userRepository.restore(id);
  }

  async checkLoginExists(login: string): Promise<boolean> {
    const count = await this.userRepository.count({
      where: { login, deletedAt: IsNull() },
    });
    return count > 0;
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const count = await this.userRepository.count({
      where: { email, deletedAt: IsNull() },
    });
    return count > 0;
  }

  private createQueryBuilder(alias: string = 'user'): SelectQueryBuilder<User> {
    return this.userRepository
      .createQueryBuilder(alias)
      .where(`${alias}.deletedAt IS NULL`)
      .orderBy(`${alias}.createdAt`, 'DESC');
  }
}
