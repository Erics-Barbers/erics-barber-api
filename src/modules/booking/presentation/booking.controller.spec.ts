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
  let getBookingsUseCase: { execute: jest.Mock };
  let createBookingUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    getBookingsUseCase = { execute: jest.fn() };
    createBookingUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        { provide: GetBookingsUseCase, useValue: getBookingsUseCase },
        {
          provide: GetBookingDetailsUseCase,
          useValue: { execute: jest.fn() },
        },
        { provide: CreateBookingUseCase, useValue: createBookingUseCase },
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

  it('uses the authenticated user when listing bookings', async () => {
    getBookingsUseCase.execute.mockResolvedValue([]);

    await controller.getBookings('customer-id', { page: 1 });

    expect(getBookingsUseCase.execute).toHaveBeenCalledWith('customer-id', {
      page: 1,
    });
  });

  it('uses the authenticated user when creating a booking', async () => {
    createBookingUseCase.execute.mockResolvedValue(undefined);
    const dto = {
      serviceId: 'service-id',
      barberId: 'barber-id',
      appointmentDate: new Date('2026-07-01T10:00:00.000Z'),
    };

    await controller.createBooking('customer-id', dto);

    expect(createBookingUseCase.execute).toHaveBeenCalledWith(
      'customer-id',
      dto,
    );
  });
});
