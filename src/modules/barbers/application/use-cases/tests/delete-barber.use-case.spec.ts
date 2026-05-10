import { DeleteBarberUseCase } from '../delete-barber.use-case';

describe('DeleteBarberUseCase', () => {
  let deleteBarberUseCase: DeleteBarberUseCase;
  let barbersService: any;

  beforeEach(() => {
    barbersService = {
      deleteBarber: jest.fn(),
    };
    deleteBarberUseCase = new DeleteBarberUseCase(barbersService);
  });

  it('should delete a barber by ID', async () => {
    barbersService.deleteBarber.mockResolvedValue(undefined);

    await deleteBarberUseCase.execute('barber-1');

    expect(barbersService.deleteBarber).toHaveBeenCalledWith('barber-1');
  });

  it('should return whatever the service returns', async () => {
    const mockResult = { id: 'barber-1', displayName: 'Eric' };
    barbersService.deleteBarber.mockResolvedValue(mockResult);

    const result = await deleteBarberUseCase.execute('barber-1');

    expect(result).toEqual(mockResult);
  });

  it('should propagate errors from the barbers service', async () => {
    barbersService.deleteBarber.mockRejectedValue(new Error('Barber not found'));

    await expect(deleteBarberUseCase.execute('non-existent-id')).rejects.toThrow('Barber not found');
  });
});
