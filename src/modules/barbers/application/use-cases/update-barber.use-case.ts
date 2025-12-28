import { Injectable } from '@nestjs/common';
import { BarbersService } from '../../infrastructure/prisma/barbers.prisma-repository';

@Injectable()
export class UpdateBarberUseCase {
  constructor(private readonly barbersService: BarbersService) {}
  async execute(): Promise<void> {}
}
