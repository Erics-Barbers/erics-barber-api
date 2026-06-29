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
import { OptionalAuthGuard } from 'src/common/guards/optional-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { BookingGuard } from 'src/common/guards/booking.guard';
import { Role } from 'src/common/constants/role.enum';

describe('BookingController', () => {
  let controller: BookingController;
  let getBookingsUseCase: { execute: jest.Mock };
  let getBookingDetailsUseCase: { execute: jest.Mock };
  let createBookingUseCase: { execute: jest.Mock };
  let updateBookingUseCase: { execute: jest.Mock; cancel: jest.Mock };

  beforeEach(async () => {
    getBookingsUseCase = { execute: jest.fn() };
    getBookingDetailsUseCase = { execute: jest.fn() };
    createBookingUseCase = { execute: jest.fn() };
    updateBookingUseCase = { execute: jest.fn(), cancel: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        { provide: GetBookingsUseCase, useValue: getBookingsUseCase },
        {
          provide: GetBookingDetailsUseCase,
          useValue: getBookingDetailsUseCase,
        },
        { provide: CreateBookingUseCase, useValue: createBookingUseCase },
        { provide: UpdateBookingUseCase, useValue: updateBookingUseCase },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(OptionalAuthGuard)
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
    const booking = { id: 'booking-id', status: 'CONFIRMED' };
    createBookingUseCase.execute.mockResolvedValue(booking);
    const dto = {
      serviceId: 'service-id',
      barberId: 'barber-id',
      appointmentDate: new Date('2026-07-01T10:00:00.000Z'),
    };

    const result = await controller.createBooking('customer-id', dto);

    expect(createBookingUseCase.execute).toHaveBeenCalledWith(
      'customer-id',
      dto,
    );
    expect(result).toEqual({
      message: 'Booking created successfully',
      booking,
    });
  });

  it('uses the authenticated user and role when reading booking details', async () => {
    getBookingDetailsUseCase.execute.mockResolvedValue({ id: 'booking-id' });

    await controller.getBookingDetails(
      'customer-id',
      Role.Customer,
      'booking-id',
    );

    expect(getBookingDetailsUseCase.execute).toHaveBeenCalledWith(
      'booking-id',
      'customer-id',
      Role.Customer,
    );
  });

  it('uses the authenticated user and role when updating a booking', async () => {
    updateBookingUseCase.execute.mockResolvedValue(undefined);
    const dto = {
      appointmentDate: new Date('2026-07-01T10:30:00.000Z'),
    };

    await controller.updateBooking(
      'customer-id',
      Role.Customer,
      'booking-id',
      dto,
    );

    expect(updateBookingUseCase.execute).toHaveBeenCalledWith(
      'booking-id',
      'customer-id',
      Role.Customer,
      dto,
    );
  });

  it('cancels bookings through the dedicated cancel use case path', async () => {
    updateBookingUseCase.cancel.mockResolvedValue(undefined);

    await controller.cancelBooking('customer-id', Role.Customer, 'booking-id');

    expect(updateBookingUseCase.cancel).toHaveBeenCalledWith(
      'booking-id',
      'customer-id',
      Role.Customer,
    );
  });
});
