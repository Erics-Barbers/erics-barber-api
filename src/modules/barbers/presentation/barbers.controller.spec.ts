import { Test, TestingModule } from '@nestjs/testing';
import { BarbersController } from './barbers.controller';
import { GetBarberUseCase } from '../application/use-cases/get-barber.use-case';
import { GetBarbersUseCase } from '../application/use-cases/get-barbers.use-case';
import { CreateBarberUseCase } from '../application/use-cases/create-barber.use-case';
import { UpdateBarberUseCase } from '../application/use-cases/update-barber.use-case';
import { DeleteBarberUseCase } from '../application/use-cases/delete-barber.use-case';
import { TokenService } from 'src/modules/auth/infrastructure/services/jwt.service';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { DeleteBarberDto } from './dto/delete-barber.dto';

describe('BarbersController', () => {
  let controller: BarbersController;
  const mockGetBarberUseCase = { execute: jest.fn() };
  const mockGetBarbersUseCase = { execute: jest.fn() };
  const mockCreateBarberUseCase = { execute: jest.fn() };
  const mockUpdateBarberUseCase = { execute: jest.fn() };
  const mockDeleteBarberUseCase = { execute: jest.fn() };
  const mockTokenService = { verifyToken: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BarbersController],
      providers: [
        { provide: GetBarberUseCase, useValue: mockGetBarberUseCase },
        { provide: GetBarbersUseCase, useValue: mockGetBarbersUseCase },
        { provide: CreateBarberUseCase, useValue: mockCreateBarberUseCase },
        { provide: UpdateBarberUseCase, useValue: mockUpdateBarberUseCase },
        { provide: DeleteBarberUseCase, useValue: mockDeleteBarberUseCase },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    controller = module.get<BarbersController>(BarbersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET /barbers should return a list of barbers', async () => {
    const mockBarbers = [
      { id: 'barber-1', displayName: 'Eric' },
      { id: 'barber-2', displayName: 'John' },
    ];
    mockGetBarbersUseCase.execute.mockResolvedValue(mockBarbers);

    const result = await controller.getBarbers();

    expect(mockGetBarbersUseCase.execute).toHaveBeenCalled();
    expect(result).toEqual(mockBarbers);
  });

  it('POST /barbers should create a barber and return success message', async () => {
    const mockCreatedBarber = { id: 'barber-1', displayName: 'Eric' };
    mockCreateBarberUseCase.execute.mockResolvedValue(mockCreatedBarber);

    const dto: CreateBarberDto = {
      barberId: 'user-1',
      name: 'Eric',
      email: 'eric@example.com',
      phone: '+44123456789',
    };
    const result = await controller.createBarber(dto);

    expect(mockCreateBarberUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ message: 'Barber created successfully', barber: mockCreatedBarber });
  });

  it('PUT /barbers/:id should update a barber and return success message', async () => {
    const mockUpdatedBarber = { id: 'barber-1' };
    mockUpdateBarberUseCase.execute.mockResolvedValue(mockUpdatedBarber);

    const dto: UpdateBarberDto = { id: 'barber-1' };
    const result = await controller.updateBarber(dto);

    expect(mockUpdateBarberUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ message: 'Barber updated successfully', barber: mockUpdatedBarber });
  });

  it('DELETE /barbers/:id should delete a barber and return success message', async () => {
    mockDeleteBarberUseCase.execute.mockResolvedValue(undefined);

    const dto: DeleteBarberDto = { id: 'barber-1' };
    const result = await controller.deleteBarber(dto);

    expect(mockDeleteBarberUseCase.execute).toHaveBeenCalledWith(dto.id);
    expect(result).toEqual({ message: 'Barber deleted successfully' });
  });
});
