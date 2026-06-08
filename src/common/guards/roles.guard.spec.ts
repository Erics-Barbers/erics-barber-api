import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../constants/role.enum';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  function createContext(role?: Role): ExecutionContext {
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { role } : undefined,
        }),
      }),
    };

    return context as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows requests when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows requests when the user has an allowed role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.Admin, Role.Customer]);

    expect(guard.canActivate(createContext(Role.Customer))).toBe(true);
  });

  it('rejects requests when the user role is not allowed', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.Admin]);

    expect(() => guard.canActivate(createContext(Role.Customer))).toThrow(
      ForbiddenException,
    );
  });
});
