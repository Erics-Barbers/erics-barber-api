import { Injectable } from '@nestjs/common';
import { BarbersService } from '../../infrastructure/prisma/barbers.prisma-repository';
import { UpdateBarberDto } from '../../presentation/dto/update-barber.dto';

@Injectable()
export class UpdateBarberUseCase {
  constructor(private readonly barbersService: BarbersService) {}
  async execute(id: string, dto: UpdateBarberDto): Promise<void> {
    const barber = this.barbersService.updateBarber(id, dto);
    return barber;
  }
}
