import { Controller, Get, Param, Query } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get()
  async getTokens() {
    return this.tokenService.getAiAgentTokens();
  }

  @Get(':id')
  async getTokenDetails(@Param('id') id: string) {
    return this.tokenService.getTokenDetails(id);
  }
}
