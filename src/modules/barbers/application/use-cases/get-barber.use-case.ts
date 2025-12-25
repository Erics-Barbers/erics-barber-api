import { Injectable } from '@nestjs/common';

import { BarbersService } from '../../infrastructure/prisma/barbers.prisma-repository';

@Injectable()
export class GetBarberUseCase {
  constructor(private readonly barbersService: BarbersService) {}

  async execute(barberId: string) {
    return await this.barbersService.getBarberById(barberId);
  }
}
