jest.mock('src/infrastructure/mail/resend.service');

import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { GetBookingsUseCase } from '../application/use-cases/get-bookings.use-case';
import { GetBookingDetailsUseCase } from '../application/use-cases/get-booking.use-case';
import { CreateBookingUseCase } from '../application/use-cases/create-booking.use-case';
import { UpdateBookingUseCase } from '../application/use-cases/update-booking.use-case';
import { TokenService } from 'src/modules/auth/infrastructure/services/jwt.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { GetBookingsQueryDto } from './dto/get-booking.dto';

describe('BookingController', () => {
  let controller: BookingController;
  const mockGetBookingsUseCase = { execute: jest.fn() };
  const mockGetBookingDetailsUseCase = { execute: jest.fn() };
  const mockCreateBookingUseCase = { execute: jest.fn() };
  const mockUpdateBookingUseCase = { execute: jest.fn() };
  const mockTokenService = { verifyToken: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        { provide: GetBookingsUseCase, useValue: mockGetBookingsUseCase },
        { provide: GetBookingDetailsUseCase, useValue: mockGetBookingDetailsUseCase },
        { provide: CreateBookingUseCase, useValue: mockCreateBookingUseCase },
        { provide: UpdateBookingUseCase, useValue: mockUpdateBookingUseCase },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET /booking should return a list of bookings', async () => {
    const mockBookings = [{ id: 'booking-1', userId: 'user-1' }];
    mockGetBookingsUseCase.execute.mockResolvedValue(mockBookings);

    const query: GetBookingsQueryDto = { userId: 'user-1' };
    const result = await controller.getBookings(query);

    expect(mockGetBookingsUseCase.execute).toHaveBeenCalledWith(query);
    expect(result).toEqual(mockBookings);
  });

  it('GET /booking/:id should return booking details', async () => {
    const mockBooking = { id: 'booking-1', userId: 'user-1' };
    mockGetBookingDetailsUseCase.execute.mockResolvedValue(mockBooking);

    const result = await controller.getBookingDetails('booking-1');

    expect(mockGetBookingDetailsUseCase.execute).toHaveBeenCalledWith('booking-1');
    expect(result).toEqual(mockBooking);
  });

  it('POST /booking should create a booking and return success message', async () => {
    mockCreateBookingUseCase.execute.mockResolvedValue(undefined);

    const dto: CreateBookingDto = {
      userId: 'user-1',
      serviceId: 'service-1',
      appointmentDate: new Date('2025-01-01'),
    };
    const result = await controller.createBooking(dto);

    expect(mockCreateBookingUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ message: 'Booking created successfully' });
  });

  it('PATCH /booking/:id should update a booking and return success message', async () => {
    mockUpdateBookingUseCase.execute.mockResolvedValue(undefined);

    const dto: UpdateBookingDto = { notes: 'Updated note' };
    const result = await controller.updateBooking('booking-1', dto);

    expect(mockUpdateBookingUseCase.execute).toHaveBeenCalledWith('booking-1', dto);
    expect(result).toEqual({ message: 'Booking updated successfully' });
  });
});
