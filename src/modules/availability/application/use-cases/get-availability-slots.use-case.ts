import { Injectable } from '@nestjs/common';
import { AvailabilityService } from '../../infrastructure/availability.service';
import { GetAvailabilitySlotsQueryDto } from '../../presentation/dto/get-availability-slots.dto';

@Injectable()
export class GetAvailabilitySlotsUseCase {
  constructor(private readonly availabilityService: AvailabilityService) {}

  async execute(query: GetAvailabilitySlotsQueryDto) {
    return await this.availabilityService.getAvailableSlots(query);
  }
}
