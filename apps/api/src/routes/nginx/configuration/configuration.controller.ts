// External dependencies
import { Body, Controller, Get, Put, UseGuards, Request } from '@nestjs/common';

// Internal dependencies
import { ConfigurationService } from './configuration.service';
import { NginxConfigurationType } from 'shared/src/types';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('nginx/configuration')
export class ConfigurationController {
	constructor(private configurationService: ConfigurationService) {}

	@UseGuards(JwtAuthGuard)
	@Get()
	async get(@Request() req) {
		return this.configurationService.get(req.user.sub);
	}

	@UseGuards(JwtAuthGuard)
	@Put()
	async edit(@Request() req, @Body() nginxConfiguration: NginxConfigurationType) {
		return this.configurationService.edit(req.user.sub, nginxConfiguration);
	}
}
