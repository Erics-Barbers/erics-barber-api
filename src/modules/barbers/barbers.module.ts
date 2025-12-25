import { Module } from '@nestjs/common';
import { BarbersController } from './presentation/barbers.controller';
import { BarbersService } from './infrastructure/prisma/barbers.prisma-repository';

@Module({
  controllers: [BarbersController],
  providers: [BarbersService],
  exports: [BarbersService],
})
export class BarbersModule {}
