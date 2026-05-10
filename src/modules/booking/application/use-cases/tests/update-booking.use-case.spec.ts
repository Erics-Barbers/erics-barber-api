import { UpdateBookingUseCase } from '../update-booking.use-case';
import { UpdateBookingDto } from '../../../presentation/dto/update-booking.dto';

describe('UpdateBookingUseCase', () => {
  let updateBookingUseCase: UpdateBookingUseCase;
  let bookingService: any;

  beforeEach(() => {
    bookingService = {
      updateBooking: jest.fn(),
    };
    updateBookingUseCase = new UpdateBookingUseCase(bookingService);
  });

  it('should update a booking and return the result', async () => {
    const bookingId = 'booking-1';
    const dto: UpdateBookingDto = { notes: 'Updated note' };
    const mockUpdated = { id: bookingId, notes: 'Updated note' };
    bookingService.updateBooking.mockResolvedValue(mockUpdated);

    const result = await updateBookingUseCase.execute(bookingId, dto);

    expect(bookingService.updateBooking).toHaveBeenCalledWith(bookingId, dto);
    expect(result).toEqual(mockUpdated);
  });

  it('should update appointment date', async () => {
    const bookingId = 'booking-1';
    const newDate = new Date('2025-06-15T10:00:00Z');
    const dto: UpdateBookingDto = { appointmentDate: newDate };
    bookingService.updateBooking.mockResolvedValue({ id: bookingId, appointmentDate: newDate });

    await updateBookingUseCase.execute(bookingId, dto);

    expect(bookingService.updateBooking).toHaveBeenCalledWith(bookingId, dto);
  });

  it('should propagate errors from the booking service', async () => {
    const bookingId = 'non-existent-id';
    const dto: UpdateBookingDto = { notes: 'note' };
    bookingService.updateBooking.mockRejectedValue(new Error('Booking not found'));

    await expect(updateBookingUseCase.execute(bookingId, dto)).rejects.toThrow('Booking not found');
  });
});
