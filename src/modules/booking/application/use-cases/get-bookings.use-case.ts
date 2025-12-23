import { Injectable } from '@nestjs/common';
import { GetBookingsQueryDto } from '../../presentation/dto/get-booking.dto';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class GetBookingsUseCase {
    constructor(private readonly prisma: PrismaService) {}
    async execute(query: GetBookingsQueryDto) {
        await this.prisma.booking.findMany({
            where: {
                userId: query.userId,
            },
        }); 
    }
}
