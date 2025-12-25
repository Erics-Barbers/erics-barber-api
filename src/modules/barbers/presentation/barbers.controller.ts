import { Controller, Delete, Get, Post, Put, UseGuards } from '@nestjs/common';
import { Role } from 'src/common/constants/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CreateBarberUseCase } from '../application/use-cases/create-barber.use-case';
import { DeleteBarberUseCase } from '../application/use-cases/delete-barber.use-case';
import { GetBarberUseCase } from '../application/use-cases/get-barber.use-case';
import { GetBarbersUseCase } from '../application/use-cases/get-barbers.use-case';

@UseGuards(AuthGuard)
@Controller('barbers')
export class BarbersController {
  constructor(
    private readonly getBarberUseCase: GetBarberUseCase,
    private readonly getBarbersUseCase: GetBarbersUseCase,
    private readonly createBarberUseCase: CreateBarberUseCase,
    private readonly deleteBarberUseCase: DeleteBarberUseCase,
  ) {}

  @Get('')
  @Roles(Role.Admin, Role.Customer)
  async getBarbers() {}

  @Get(':id')
  @Roles(Role.Admin, Role.Customer, Role.Barber)
  async getBarberDetails() {}

  @Post('')
  @Roles(Role.Admin)
  async createBarber() {}

  @Put(':id')
  @Roles(Role.Admin)
  async updateBarber() {}

  @Delete(':id')
  @Roles(Role.Admin)
  async deleteBarber() {}
}
