// External dependencies
import { Controller, Request, Get, Post, Put } from '@nestjs/common';
import { Body, Param, UseGuards } from '@nestjs/common/decorators';
import { UserType } from 'shared/src/types';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

// Internal dependencies
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
	constructor(private usersService: UsersService) {}

	@Post('create')
	createUser(@Body() user: UserType) {
		return this.usersService.create(user);
	}

	@Get('verify/:verificationId')
	verifyUser(@Param('verificationId') verificationId: string) {
		return this.usersService.verifyUser(verificationId);
	}

	@UseGuards(JwtAuthGuard)
	@Put('edit/username')
	updateUsername(@Request() req) {
		return this.usersService.updateUsername(req.user, req.body.username);
	}

	@UseGuards(JwtAuthGuard)
	@Put('edit/password')
	updatePassword(@Request() req) {
		return this.usersService.updatePassword(
			req.user,
			req.body.oldPassword,
			req.body.newPassword
		);
	}

	@UseGuards(JwtAuthGuard)
	@Put('edit/role')
	updateRole(@Request() req) {
		return this.usersService.updateRole(
			req.user,
			req.body.userId,
			req.body.role
		);
	}
}
