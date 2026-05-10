import { GetBarberUseCase } from '../get-barber.use-case';

describe('GetBarberUseCase', () => {
  let getBarberUseCase: GetBarberUseCase;
  let barbersService: any;

  beforeEach(() => {
    barbersService = {
      getBarberById: jest.fn(),
    };
    getBarberUseCase = new GetBarberUseCase(barbersService);
  });

  it('should return a barber by ID', async () => {
    const mockBarber = { id: 'barber-1', displayName: 'Eric', phone: '+44123456789' };
    barbersService.getBarberById.mockResolvedValue(mockBarber);

    const result = await getBarberUseCase.execute('barber-1');

    expect(barbersService.getBarberById).toHaveBeenCalledWith('barber-1');
    expect(result).toEqual(mockBarber);
  });

  it('should return null when barber is not found', async () => {
    barbersService.getBarberById.mockResolvedValue(null);

    const result = await getBarberUseCase.execute('non-existent-id');

    expect(barbersService.getBarberById).toHaveBeenCalledWith('non-existent-id');
    expect(result).toBeNull();
  });
});
