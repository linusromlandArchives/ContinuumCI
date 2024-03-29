// External dependencies
import { Controller, Request, Get, Post, Put } from '@nestjs/common';
import { Body, Param, UseGuards } from '@nestjs/common/decorators';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

// Internal dependencies
import { UsersService } from './users.service';
import { UserQueryClass } from 'shared/src/classes';

@Controller('users')
export class UsersController {
	constructor(private usersService: UsersService) {}

	@Post('create')
	createUser(@Body() user: UserQueryClass) {
		return this.usersService.create(user);
	}

	@UseGuards(JwtAuthGuard)
	@Get('verify/resend')
	resendVerificationEmail(@Request() req) {
		return this.usersService.resendVerificationEmail(req.user.sub);
	}

	@Get('verify/:verificationId')
	verifyUser(@Param('verificationId') verificationId: string) {
		return this.usersService.verifyUser(verificationId);
	}

	@UseGuards(JwtAuthGuard)
	@Get('all')
	getUsers(@Request() req) {
		return this.usersService.getUsers(req.user);
	}

	@UseGuards(JwtAuthGuard)
	@Put('edit/username')
	updateUsername(@Request() req) {
		return this.usersService.updateUsername(req.user, req.body.username);
	}

	@UseGuards(JwtAuthGuard)
	@Put('edit/email')
	updateEmail(@Request() req) {
		return this.usersService.updateEmail(req.user, req.body.email);
	}

	@UseGuards(JwtAuthGuard)
	@Put('edit/password')
	updatePassword(@Request() req) {
		return this.usersService.updatePassword(req.user, req.body.oldPassword, req.body.newPassword);
	}

	@UseGuards(JwtAuthGuard)
	@Put('edit/role')
	updateRole(@Request() req) {
		return this.usersService.updateRole(req.user, req.body.userId, req.body.role);
	}

	@Post('forgotPassword')
	forgotPassword(@Body() body: { email: string }) {
		return this.usersService.forgotPassword(body.email);
	}

	@Post('resetPassword')
	resetPassword(@Body() body: { token: string; password: string }) {
		return this.usersService.updatePasswordWithToken(body.token, body.password);
	}

	@Get('validateResetToken/:token')
	validateResetToken(@Param('token') token: string) {
		return this.usersService.validateResetToken(token);
	}
}
