import { CreateBarberUseCase } from '../create-barber.use-case';
import { CreateBarberDto } from '../../../presentation/dto/create-barber.dto';

describe('CreateBarberUseCase', () => {
  let createBarberUseCase: CreateBarberUseCase;
  let barbersService: any;

  beforeEach(() => {
    barbersService = {
      createBarber: jest.fn(),
    };
    createBarberUseCase = new CreateBarberUseCase(barbersService);
  });

  it('should create a barber and return the created barber', async () => {
    const dto: CreateBarberDto = {
      barberId: 'user-1',
      name: 'Eric',
      email: 'eric@example.com',
      phone: '+44123456789',
    };
    const mockCreatedBarber = { id: 'barber-1', ...dto };
    barbersService.createBarber.mockResolvedValue(mockCreatedBarber);

    const result = await createBarberUseCase.execute(dto);

    expect(barbersService.createBarber).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockCreatedBarber);
  });

  it('should propagate errors from the barbers service', async () => {
    const dto: CreateBarberDto = {
      barberId: 'user-1',
      name: 'Eric',
      email: 'eric@example.com',
      phone: '+44123456789',
    };
    barbersService.createBarber.mockRejectedValue(new Error('Duplicate barber'));

    await expect(createBarberUseCase.execute(dto)).rejects.toThrow('Duplicate barber');
  });
});
