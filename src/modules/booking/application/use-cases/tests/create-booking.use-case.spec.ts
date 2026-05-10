import { CreateBookingUseCase } from '../create-booking.use-case';
import { CreateBookingDto } from '../../../presentation/dto/create-booking.dto';

describe('CreateBookingUseCase', () => {
  let createBookingUseCase: CreateBookingUseCase;
  let bookingService: any;

  beforeEach(() => {
    bookingService = {
      createBooking: jest.fn(),
    };
    createBookingUseCase = new CreateBookingUseCase(bookingService);
  });

  it('should create a booking and return the result', async () => {
    const dto: CreateBookingDto = {
      userId: 'user-1',
      serviceId: 'service-1',
      appointmentDate: new Date('2025-01-01T10:00:00Z'),
    };
    const mockBooking = { id: 'booking-1', ...dto };
    bookingService.createBooking.mockResolvedValue(mockBooking);

    const result = await createBookingUseCase.execute(dto);

    expect(bookingService.createBooking).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockBooking);
  });

  it('should create a booking with optional notes', async () => {
    const dto: CreateBookingDto = {
      userId: 'user-1',
      serviceId: 'service-1',
      appointmentDate: new Date('2025-01-01T10:00:00Z'),
      notes: 'Please use organic products',
    };
    bookingService.createBooking.mockResolvedValue({ id: 'booking-1' });

    await createBookingUseCase.execute(dto);

    expect(bookingService.createBooking).toHaveBeenCalledWith(dto);
  });

  it('should propagate errors from the booking service', async () => {
    const dto: CreateBookingDto = {
      userId: 'user-1',
      serviceId: 'service-1',
      appointmentDate: new Date('2025-01-01T10:00:00Z'),
    };
    bookingService.createBooking.mockRejectedValue(new Error('Slot not available'));

    await expect(createBookingUseCase.execute(dto)).rejects.toThrow('Slot not available');
  });
});
