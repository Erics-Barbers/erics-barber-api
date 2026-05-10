import { GetBookingDetailsUseCase } from '../get-booking.use-case';

describe('GetBookingDetailsUseCase', () => {
  let getBookingDetailsUseCase: GetBookingDetailsUseCase;
  let bookingService: any;

  beforeEach(() => {
    bookingService = {
      getBookingDetails: jest.fn(),
    };
    getBookingDetailsUseCase = new GetBookingDetailsUseCase(bookingService);
  });

  it('should return booking details for a given booking ID', async () => {
    const mockBooking = {
      id: 'booking-1',
      userId: 'user-1',
      serviceId: 'service-1',
      appointmentDate: new Date('2025-01-01T10:00:00Z'),
    };
    bookingService.getBookingDetails.mockResolvedValue(mockBooking);

    const result = await getBookingDetailsUseCase.execute('booking-1');

    expect(bookingService.getBookingDetails).toHaveBeenCalledWith('booking-1');
    expect(result).toEqual(mockBooking);
  });

  it('should return null when booking is not found', async () => {
    bookingService.getBookingDetails.mockResolvedValue(null);

    const result = await getBookingDetailsUseCase.execute('non-existent-id');

    expect(bookingService.getBookingDetails).toHaveBeenCalledWith('non-existent-id');
    expect(result).toBeNull();
  });

  it('should propagate errors from the booking service', async () => {
    bookingService.getBookingDetails.mockRejectedValue(new Error('Database error'));

    await expect(getBookingDetailsUseCase.execute('booking-1')).rejects.toThrow('Database error');
  });
});
