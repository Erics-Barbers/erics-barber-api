import { Injectable } from '@nestjs/common';
import { BarbersService } from '../../infrastructure/prisma/barbers.prisma-repository';
import { UpdateBarberDto } from '../../presentation/dto/update-barber.dto';

@Injectable()
export class UpdateBarberUseCase {
  constructor(private readonly barbersService: BarbersService) {}
  async execute(dto: UpdateBarberDto): Promise<void> {
    const { id, ...data } = dto;
    const barber = this.barbersService.updateBarber(id, data);
    return barber;
  }
}
