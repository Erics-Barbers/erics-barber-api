import { UpdateBarberUseCase } from '../update-barber.use-case';
import { UpdateBarberDto } from '../../../presentation/dto/update-barber.dto';

describe('UpdateBarberUseCase', () => {
  let updateBarberUseCase: UpdateBarberUseCase;
  let barbersService: any;

  beforeEach(() => {
    barbersService = {
      updateBarber: jest.fn(),
    };
    updateBarberUseCase = new UpdateBarberUseCase(barbersService);
  });

  it('should call updateBarber with the correct id and data', async () => {
    const dto: UpdateBarberDto = { id: 'barber-1' };
    barbersService.updateBarber.mockResolvedValue(undefined);

    await updateBarberUseCase.execute(dto);

    const { id, ...data } = dto;
    expect(barbersService.updateBarber).toHaveBeenCalledWith(id, data);
  });

  it('should propagate errors from the barbers service', async () => {
    const dto: UpdateBarberDto = { id: 'barber-1' };
    barbersService.updateBarber.mockRejectedValue(new Error('Barber not found'));

    await expect(updateBarberUseCase.execute(dto)).rejects.toThrow('Barber not found');
  });
});
