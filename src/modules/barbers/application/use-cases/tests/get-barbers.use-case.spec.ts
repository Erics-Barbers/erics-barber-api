import { GetBarbersUseCase } from '../get-barbers.use-case';

describe('GetBarbersUseCase', () => {
  let getBarbersUseCase: GetBarbersUseCase;
  let barbersService: any;

  beforeEach(() => {
    barbersService = {
      getAllBarbers: jest.fn(),
    };
    getBarbersUseCase = new GetBarbersUseCase(barbersService);
  });

  it('should return a list of barbers', async () => {
    const mockBarbers = [
      { id: 'barber-1', displayName: 'Eric', phone: '+44123456789' },
      { id: 'barber-2', displayName: 'John', phone: '+44987654321' },
    ];
    barbersService.getAllBarbers.mockResolvedValue(mockBarbers);

    const result = await getBarbersUseCase.execute();

    expect(barbersService.getAllBarbers).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockBarbers);
  });

  it('should return an empty array when no barbers exist', async () => {
    barbersService.getAllBarbers.mockResolvedValue([]);

    const result = await getBarbersUseCase.execute();

    expect(result).toEqual([]);
  });
});
