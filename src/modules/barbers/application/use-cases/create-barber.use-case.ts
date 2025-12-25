import { Injectable } from '@nestjs/common';
import { BarbersService } from '../../infrastructure/prisma/barbers.prisma-repository';

Injectable();
export class CreateBarberUseCase {
  constructor(private readonly barbersService: BarbersService) {}

  async execute(userId: string, phone: string) {
    return await this.barbersService.createBarber({
      userId,
      phone,
    });
  }
}
