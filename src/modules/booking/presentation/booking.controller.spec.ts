jest.mock('src/infrastructure/mail/resend.service', () => ({
  ResendService: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { GetBookingsUseCase } from '../application/use-cases/get-bookings.use-case';
import { GetBookingDetailsUseCase } from '../application/use-cases/get-booking.use-case';
import { CreateBookingUseCase } from '../application/use-cases/create-booking.use-case';
import { UpdateBookingUseCase } from '../application/use-cases/update-booking.use-case';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { BookingGuard } from 'src/common/guards/booking.guard';

describe('BookingController', () => {
  let controller: BookingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        { provide: GetBookingsUseCase, useValue: { execute: jest.fn() } },
        {
          provide: GetBookingDetailsUseCase,
          useValue: { execute: jest.fn() },
        },
        { provide: CreateBookingUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateBookingUseCase, useValue: { execute: jest.fn() } },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(BookingGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<BookingController>(BookingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
