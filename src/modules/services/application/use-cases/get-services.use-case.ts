import { Injectable } from '@nestjs/common';
import { ServicesRepository } from '../../infrastructure/prisma/services.prisma-repository';

@Injectable()
export class GetServicesUseCase {
  constructor(private readonly servicesRepository: ServicesRepository) {}

  async execute() {
    return await this.servicesRepository.getActiveServices();
  }
}
