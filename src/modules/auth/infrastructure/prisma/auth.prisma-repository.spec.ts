import { Role } from 'src/generated/prisma/client';
import { AuthService } from './auth.prisma-repository';

describe('AuthService repository', () => {
  it('deletes only unverified customer users created before the cutoff', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 2 });
    const prismaService = {
      user: {
        deleteMany,
      },
    };
    const authService = new AuthService(
      prismaService as never,
      {} as never,
      {} as never,
    );
    const cutoff = new Date('2026-06-06T02:00:00.000Z');

    await expect(
      authService.deleteUnverifiedCustomersCreatedBefore(cutoff),
    ).resolves.toBe(2);

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        isEmailVerified: false,
        role: Role.CUSTOMER,
        createdAt: { lt: cutoff },
      },
    });
  });
});
