import { Injectable } from '@nestjs/common';
import { BarbersService } from '../../infrastructure/prisma/barbers.prisma-repository';
import { CreateBarberDto } from '../../presentation/dto/create-barber.dto';

@Injectable()
export class CreateBarberUseCase {
  constructor(private readonly barbersService: BarbersService) {}

  async execute(dto: CreateBarberDto) {
    return await this.barbersService.createBarber(dto);
  }
}
