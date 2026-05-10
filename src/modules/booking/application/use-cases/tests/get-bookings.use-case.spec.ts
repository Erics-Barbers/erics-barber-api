import { GetBookingsUseCase } from '../get-bookings.use-case';
import { GetBookingsQueryDto } from '../../../presentation/dto/get-booking.dto';

describe('GetBookingsUseCase', () => {
  let getBookingsUseCase: GetBookingsUseCase;
  let bookingService: any;

  beforeEach(() => {
    bookingService = {
      getBookings: jest.fn(),
    };
    getBookingsUseCase = new GetBookingsUseCase(bookingService);
  });

  it('should return a list of bookings for a user', async () => {
    const mockBookings = [
      { id: 'booking-1', userId: 'user-1' },
      { id: 'booking-2', userId: 'user-1' },
    ];
    bookingService.getBookings.mockResolvedValue(mockBookings);

    const query: GetBookingsQueryDto = { userId: 'user-1' };
    const result = await getBookingsUseCase.execute(query);

    expect(bookingService.getBookings).toHaveBeenCalledWith(query);
    expect(result).toEqual(mockBookings);
  });

  it('should support pagination parameters', async () => {
    const mockBookings = [{ id: 'booking-1', userId: 'user-1' }];
    bookingService.getBookings.mockResolvedValue(mockBookings);

    const query: GetBookingsQueryDto = { userId: 'user-1', page: 2, limit: 10 };
    const result = await getBookingsUseCase.execute(query);

    expect(bookingService.getBookings).toHaveBeenCalledWith(query);
    expect(result).toEqual(mockBookings);
  });

  it('should return an empty list when no bookings exist', async () => {
    bookingService.getBookings.mockResolvedValue([]);

    const query: GetBookingsQueryDto = { userId: 'user-1' };
    const result = await getBookingsUseCase.execute(query);

    expect(result).toEqual([]);
  });

  it('should propagate errors from the booking service', async () => {
    bookingService.getBookings.mockRejectedValue(new Error('Database error'));

    const query: GetBookingsQueryDto = { userId: 'user-1' };
    await expect(getBookingsUseCase.execute(query)).rejects.toThrow('Database error');
  });
});
