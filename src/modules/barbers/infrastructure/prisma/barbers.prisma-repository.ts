import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateBarberDto } from '../../presentation/dto/create-barber.dto';

@Injectable()
export class BarbersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllBarbers() {
    return await this.prismaService.barber.findMany();
  }

  async getBarberById(barberId: string) {
    return await this.prismaService.barber.findUnique({
      where: { id: barberId },
    });
  }

  async createBarber(dto: CreateBarberDto) {
    await this.prismaService.barber.create({
      data: {
        phone: dto.phone,
        user: { connect: { id: dto.userId } },
      },
    });
  }

  async updateBarber(barberId: string, dto: Partial<CreateBarberDto>) {
    await this.prismaService.barber.update({
      where: { id: barberId },
      data: {
        phone: dto.phone,
      },
    });
  }

  async deleteBarber(barberId: string) {
    await this.prismaService.barber.delete({
      where: { id: barberId },
    });
  }
}
