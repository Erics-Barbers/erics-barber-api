import { Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AutomationService } from './automation.service';

@ApiExcludeController()
@Controller('internal/automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('reset')
  @HttpCode(200)
  reset(@Headers('authorization') authorization?: string) {
    return this.automationService.reset(authorization);
  }
}
