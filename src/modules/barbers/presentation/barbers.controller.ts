import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'src/common/constants/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CreateBarberUseCase } from '../application/use-cases/create-barber.use-case';
import { DeleteBarberUseCase } from '../application/use-cases/delete-barber.use-case';
import { GetBarberUseCase } from '../application/use-cases/get-barber.use-case';
import { GetBarbersUseCase } from '../application/use-cases/get-barbers.use-case';
import { GetBarberDto } from './dto/get-barber.dto';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberUseCase } from '../application/use-cases/update-barber.use-case';
import { DeleteBarberDto } from './dto/delete-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';

@UseGuards(AuthGuard)
@Controller('barbers')
export class BarbersController {
  constructor(
    private readonly getBarberUseCase: GetBarberUseCase,
    private readonly getBarbersUseCase: GetBarbersUseCase,
    private readonly createBarberUseCase: CreateBarberUseCase,
    private readonly updateBarberUseCase: UpdateBarberUseCase,
    private readonly deleteBarberUseCase: DeleteBarberUseCase,
  ) {}

  @HttpCode(200)
  @Get('')
  @Roles(Role.Admin, Role.Customer)
  async getBarbers() {
    const barbers = await this.getBarbersUseCase.execute();
    return barbers;
  }

  @HttpCode(200)
  @Get(':id')
  @Roles(Role.Admin, Role.Customer, Role.Barber)
  async getBarberDetails(dto: GetBarberDto) {
    const barber = await this.getBarberUseCase.execute(dto.id);
    return barber;
  }

  @HttpCode(201)
  @Post('')
  @Roles(Role.Admin)
  async createBarber(dto: CreateBarberDto) {
    const barber = await this.createBarberUseCase.execute(dto);
    return { message: 'Barber created successfully', barber };
  }

  @HttpCode(200)
  @Put(':id')
  @Roles(Role.Admin)
  async updateBarber(dto: UpdateBarberDto) {
    const barber = await this.updateBarberUseCase.execute(dto);
    return { message: 'Barber updated successfully', barber };
  }

  @HttpCode(200)
  @Delete(':id')
  @Roles(Role.Admin)
  async deleteBarber(dto: DeleteBarberDto) {
    await this.deleteBarberUseCase.execute(dto.id);
    return { message: 'Barber deleted successfully' };
  }
}
