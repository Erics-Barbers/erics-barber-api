import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class ServicesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getActiveServices() {
    return await this.prismaService.service.findMany({
      where: { isActive: true },
      orderBy: [{ pricePence: 'desc' }, { name: 'asc' }],
    });
  }
}
