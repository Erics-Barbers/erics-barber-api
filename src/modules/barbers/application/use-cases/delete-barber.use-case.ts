import { Injectable } from '@nestjs/common';
import { BarbersService } from '../../infrastructure/prisma/barbers.prisma-repository';

@Injectable()
export class DeleteBarberUseCase {
  constructor(private readonly barbersService: BarbersService) {}

  async execute(barberId: string) {
    return await this.barbersService.deleteBarber(barberId);
  }
}
