import { Controller, Get, HttpCode } from '@nestjs/common';
import { GetServicesUseCase } from '../application/use-cases/get-services.use-case';

@Controller('services')
export class ServicesController {
  constructor(private readonly getServicesUseCase: GetServicesUseCase) {}

  @HttpCode(200)
  @Get('')
  async getServices() {
    return await this.getServicesUseCase.execute();
  }
}
