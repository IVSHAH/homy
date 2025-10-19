import { createAccessTokenPayload, createMinimalAccessTokenPayload } from './payload.utils';
import { User } from '../../features/users/entities/user.entity';

describe('Payload Utils', () => {
  describe('createAccessTokenPayload', () => {
    it('should create access token payload from user', () => {
      const user = new User();
      user.id = 123;
      user.login = 'testuser';
      user.email = 'test@example.com';
      user.password = 'hashed';
      user.age = 25;

      const payload = createAccessTokenPayload(user);

      expect(payload).toEqual({
        userId: 123,
        login: 'testuser',
        email: 'test@example.com',
      });
    });

    it('should not include sensitive fields in payload', () => {
      const user = new User();
      user.id = 1;
      user.login = 'admin';
      user.email = 'admin@example.com';
      user.password = 'super_secret_hash';
      user.age = 30;

      const payload = createAccessTokenPayload(user);

      expect(payload).not.toHaveProperty('password');
      expect(payload).not.toHaveProperty('age');
      expect(payload).not.toHaveProperty('refreshTokenHash');
    });
  });

  describe('createMinimalAccessTokenPayload', () => {
    it('should create minimal payload from raw data', () => {
      const payload = createMinimalAccessTokenPayload(456, 'john', 'john@example.com');

      expect(payload).toEqual({
        userId: 456,
        login: 'john',
        email: 'john@example.com',
      });
    });

    it('should create payload without User entity', () => {
      const payload = createMinimalAccessTokenPayload(1, 'testuser', 'test@test.com');

      expect(payload.userId).toBe(1);
      expect(payload.login).toBe('testuser');
      expect(payload.email).toBe('test@test.com');
    });
  });
});
