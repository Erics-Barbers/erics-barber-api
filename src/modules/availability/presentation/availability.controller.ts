import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { GetAvailabilitySlotsUseCase } from '../application/use-cases/get-availability-slots.use-case';
import { GetAvailabilitySlotsQueryDto } from './dto/get-availability-slots.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly getAvailabilitySlotsUseCase: GetAvailabilitySlotsUseCase,
  ) {}

  @HttpCode(200)
  @ApiQuery({ name: 'barberId', required: true, type: String })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    example: '2026-07-06',
  })
  @ApiQuery({ name: 'serviceId', required: false, type: String })
  @Get('slots')
  async getSlots(@Query() query: GetAvailabilitySlotsQueryDto) {
    return await this.getAvailabilitySlotsUseCase.execute(query);
  }
}
