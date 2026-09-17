import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOkResponse({ schema: { type: 'string', example: 'Hello World!' } })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/debug-sentry')
  @ApiOperation({ summary: 'Trigger a test error for Sentry verification' })
  @ApiInternalServerErrorResponse({
    description: 'Intentional error captured by Sentry.',
  })
  getError(): never {
    throw new Error('sentry error!');
  }
}
