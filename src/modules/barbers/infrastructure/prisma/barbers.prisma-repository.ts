import { Injectable } from '@nestjs/common';
import { ResendService } from 'src/infrastructure/mail/resend.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateBarberDto } from '../../presentation/dto/create-barber.dto';
import { BarberCreateInput } from 'generated/prisma/models';

@Injectable()
export class BarbersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly resendService: ResendService,
  ) {}

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

  async deleteBarber(barberId: string) {
    await this.prismaService.barber.delete({
      where: { id: barberId },
    });
  }
}
