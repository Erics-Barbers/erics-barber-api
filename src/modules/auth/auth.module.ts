// Module
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

// Controller
import { AuthController } from './presentation/controllers/auth.controller';

// Providers
import { AuthService } from './infrastructure/prisma/auth.prisma-repository';
import { BcryptService } from './infrastructure/services/bcrypt.service';
import { TokenService } from './infrastructure/services/jwt-token.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, BcryptService, TokenService],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
