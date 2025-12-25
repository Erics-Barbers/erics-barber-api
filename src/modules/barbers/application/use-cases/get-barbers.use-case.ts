import { Injectable } from '@nestjs/common';
import { BarbersService } from '../../infrastructure/prisma/barbers.prisma-repository';

@Injectable()
export class GetBarbersUseCase {
  constructor(private readonly barbersService: BarbersService) {}

  async execute() {
    return await this.barbersService.getAllBarbers();
  }
}
