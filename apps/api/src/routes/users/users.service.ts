// External dependencies
import {
	Injectable,
	Inject,
	BadRequestException,
	InternalServerErrorException,
	UnauthorizedException
} from '@nestjs/common';
import { isValidObjectId, Model } from 'mongoose';
import dayjs from 'dayjs';

// Internal dependencies
import { JwtType, ResponseType, EmailVerificationType, ForgotPasswordType } from 'shared/src/types';
import { UserClass, UserQueryClass } from 'shared/src/classes';
import { EmailConfigurationClass } from 'shared/src/classes';
import { EmailConfigurationService } from '../emailConfiguration/emailConfiguration.service';
import { UserRoleEnum } from 'shared/src/enums';
import { comparePassword, hashPassword } from 'src/utils/hashPassword';

@Injectable()
export class UsersService {
	constructor(
		private emailConfigurationService: EmailConfigurationService,

		@Inject('USER_MODEL')
		private UserModel: Model<UserClass>,

		@Inject('EMAIL_VERIFICATION_MODEL')
		private EmailVerificationModel: Model<EmailVerificationType>,

		@Inject('EMAIL_CONFIGURATION_MODEL')
		private EmailConfigurationModel: Model<EmailConfigurationClass>,

		@Inject('FORGOT_PASSWORD_MODEL')
		private ForgotPasswordModel: Model<ForgotPasswordType>
	) {}

	async create(user: UserQueryClass): Promise<ResponseType> {
		try {
			const role = (await this.UserModel.countDocuments()) === 0 ? UserRoleEnum.ROOT : UserRoleEnum.USER;
			const createdUser = new this.UserModel({
				...user,
				password: hashPassword(user.password),
				role,
				verifiedEmail: role === UserRoleEnum.ROOT ? true : false
			});

			if (!createdUser.verifiedEmail) {
				if (
					!(await this.EmailConfigurationModel.countDocuments({
						service: { $ne: 'skipped' }
					}))
				) {
					createdUser.verifiedEmail = true;
				} else {
					const emailVerification = new this.EmailVerificationModel({
						user: createdUser._id
					});

					await emailVerification.save();

					// Send email verification email
					await this.emailConfigurationService.sendVerificationEmail(
						createdUser.email,
						emailVerification._id,
						dayjs(emailVerification.createdAt).add(30, 'minutes').toDate()
					);
				}
			}

			await createdUser.save();
			return {
				success: true,
				message: 'User created successfully'
			};
			// eslint-disable-next-line  @typescript-eslint/no-explicit-any
		} catch (error: any) {
			//check if error is duplicate key error on username or email
			if (error.code === 11000 && (error.keyPattern['username'] || error.keyPattern['email'])) {
				throw new BadRequestException({
					success: false,
					message: `${error.keyPattern['username'] ? 'Username' : 'Email'} already in use`
				});
			}

			//check if error is validation error for missing required fields
			if (error.name === 'ValidationError') {
				throw new BadRequestException({
					success: false,
					message: 'Missing required fields'
				});
			}

			throw new InternalServerErrorException({
				success: false,
				message: (error as string | null) || 'Something went wrong'
			});
		}
	}

	async resendVerificationEmail(userId: string) {
		try {
			if (!userId) {
				throw new BadRequestException({
					success: false,
					message: 'Missing required fields'
				});
			}

			if (!isValidObjectId(userId)) {
				throw new BadRequestException({
					success: false,
					message: 'Invalid user id'
				});
			}

			const user = await this.UserModel.findById(userId);
			if (!user) {
				throw new BadRequestException({
					success: false,
					message: 'User not found'
				});
			}

			if (user.verifiedEmail) {
				throw new BadRequestException({
					success: false,
					message: 'User already verified'
				});
			}

			// Delete any existing email verification
			await this.EmailVerificationModel.deleteMany({ user: user._id });

			const emailVerification = new this.EmailVerificationModel({
				user: user._id
			});

			await emailVerification.save();

			// Send email verification email
			await this.emailConfigurationService.sendVerificationEmail(
				user.email,
				emailVerification._id,
				dayjs(emailVerification.createdAt).add(30, 'minutes').toDate()
			);

			return {
				success: true,
				message: 'Email verification resent successfully'
			};

			// eslint-disable-next-line  @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error instanceof BadRequestException) {
				throw error;
			}

			//check if error is validation error for missing required fields
			if (error.name === 'ValidationError') {
				throw new BadRequestException({
					success: false,
					message: 'Missing required fields'
				});
			}

			throw new InternalServerErrorException({
				success: false,
				message: (error as string | null) || 'Something went wrong'
			});
		}
	}

	async verifyUser(verificationId: string) {
		try {
			const emailVerification = await this.EmailVerificationModel.findById(verificationId);
			if (!emailVerification) {
				throw new BadRequestException({
					success: false,
					message: 'Invalid verification id'
				});
			}

			const user = await this.UserModel.findById(emailVerification.user);
			if (!user) {
				throw new BadRequestException({
					success: false,
					message: 'User not found'
				});
			}

			await emailVerification.remove();

			// Check if verification link is expired (30 minutes old or more)
			if (dayjs(emailVerification.createdAt).add(30, 'minutes').isBefore(dayjs())) {
				throw new UnauthorizedException({
					success: false,
					message: 'Verification link expired'
				});
			}

			user.verifiedEmail = true;
			await user.save();

			return {
				success: true,
				message: 'User verified successfully'
			};
			// eslint-disable-next-line  @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error instanceof BadRequestException) {
				throw error;
			}

			//check if error is validation error for missing required fields
			if (error.name === 'ValidationError') {
				throw new BadRequestException({
					success: false,
					message: 'Missing required fields'
				});
			}

			throw new InternalServerErrorException({
				success: false,
				message: (error as string | null) || 'Something went wrong'
			});
		}
	}

	async getUsers(user: JwtType) {
		try {
			const updatedUser = await this.UserModel.findById(user.sub);
			if (!updatedUser) {
				throw new BadRequestException({
					success: false,
					message: 'User not found'
				});
			}

			if (updatedUser.role !== UserRoleEnum.ROOT) {
				throw new UnauthorizedException({
					success: false,
					message: 'Unauthorized'
				});
			}

			const users = await this.UserModel.find(
				{},
				{
					_id: 1,
					username: 1,
					email: 1,
					role: 1,
					verifiedEmail: 1,
					lastIp: 1,
					lastLogin: 1,
					createdAt: 1,
					updatedAt: 1
				}
			);

			return {
				success: true,
				message: 'Users fetched successfully',
				data: users
			};
			// eslint-disable-next-line  @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
				throw error;
			}

			throw new InternalServerErrorException({
				success: false,
				message: (error as string | null) || 'Something went wrong'
			});
		}
	}

	async updateUsername(user: JwtType, newUsername: string): Promise<ResponseType> {
		try {
			const updatedUser = await this.UserModel.findById(user.sub);
			if (!updatedUser) {
				throw new BadRequestException({
					success: false,
					message: 'User not found'
				});
			}

			updatedUser.username = newUsername;
			await updatedUser.save();

			return {
				success: true,
				message: 'Username updated successfully'
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			//check if error is duplicate key error on username or email
			if (error.code === 11000 && error.keyPattern['username']) {
				throw new BadRequestException({
					success: false,
					message: 'Username already in use'
				});
			}

			//check if error is validation error for missing required fields
			if (error.name === 'ValidationError') {
				throw new BadRequestException({
					success: false,
					message: 'Missing required fields'
				});
			}

			throw new InternalServerErrorException({
				success: false,
				message: (error as string | null) || 'Something went wrong'
			});
		}
	}

	async updateEmail(user: JwtType, newEmail: string): Promise<ResponseType> {
		try {
			const updatedUser = await this.UserModel.findById(user.sub);
			if (!updatedUser) {
				throw new BadRequestException({
					success: false,
					message: 'User not found'
				});
			}

			updatedUser.email = newEmail;
			updatedUser.verifiedEmail = false;
			await updatedUser.save();
			if (
				await this.EmailConfigurationModel.countDocuments({
					service: { $ne: 'skipped' }
				})
			) {
				const emailVerification = new this.EmailVerificationModel({
					user: updatedUser._id
				});

				await emailVerification.save();

				// Send email verification email
				await this.emailConfigurationService.sendVerificationEmail(
					newEmail,
					emailVerification._id,
					dayjs(emailVerification.createdAt).add(30, 'minutes').toDate()
				);
			}

			return {
				success: true,
				message: 'Email updated successfully'
			};
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			//check if error is duplicate key error on username or email
			if (error.code === 11000 && error.keyPattern['email']) {
				throw new BadRequestException({
					success: false,
					message: 'Email already in use'
				});
			}

			if (error instanceof InternalServerErrorException) {
				throw error;
			}

			throw new InternalServerErrorException({
				success: false,
				message: (error as string | null) || 'Something went wrong'
			});
		}
	}

	async updatePassword(user: JwtType, oldPassword: string, newPassword: string): Promise<ResponseType> {
		try {
			if (!oldPassword || !newPassword) {
				throw new BadRequestException({
					success: false,
					message: 'Missing required fields'
				});
			}

			const updatedUser = await this.UserModel.findById(user.sub);
			if (!updatedUser) {
				throw new BadRequestException({
					success: false,
					message: 'User not found'
				});
			}

			if (!comparePassword(oldPassword, updatedUser.password)) {
				throw new BadRequestException({
					success: false,
					message: 'Incorrect password'
				});
			}

			updatedUser.password = hashPassword(newPassword);
			await updatedUser.save();

			return {
				success: true,
				message: 'Password updated successfully'
			};
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error instanceof BadRequestException) {
				throw error;
			}

			//check if error is validation error for missing required fields
			if (error.name === 'ValidationError') {
				throw new BadRequestException({
					success: false,
					message: 'Missing required fields'
				});
			}

			throw new InternalServerErrorException({
				success: false,
				message: (error as string | null) || 'Something went wrong'
			});
		}
	}

	async updateRole(jwtUser: JwtType, userId: string, newRole: string): Promise<ResponseType> {
		try {
			if (isValidObjectId(userId) === false) {
				throw new BadRequestException({
					success: false,
					message: 'Invalid user id'
				});
			}

			const user = await this.UserModel.findById(jwtUser.sub);

			if (!user || user.role !== UserRoleEnum.ROOT) {
				throw new UnauthorizedException({
					success: false,
					message: 'Unauthorized'
				});
			}

			if (newRole !== UserRoleEnum.USER && newRole !== UserRoleEnum.ADMIN) {
				throw new BadRequestException({
					success: false,
					message: 'Invalid role'
				});
			}

			const updateUser = await this.UserModel.findById(userId);

			if (!updateUser) {
				throw new BadRequestException({
					success: false,
					message: 'User not found'
				});
			}

			if (updateUser.role === newRole) {
				throw new BadRequestException({
					success: false,
					message: 'User already set to ' + newRole
				});
			}

			if (updateUser.role === 'root') {
				throw new BadRequestException({
					success: false,
					message: 'Cannot change root user role'
				});
			}

			updateUser.role = newRole;
			await updateUser.save();

			return {
				success: true,
				message: 'Role updated successfully'
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error instanceof BadRequestException) {
				throw error;
			}

			throw new InternalServerErrorException({
				success: false,
				message: (error as string | null) || 'Something went wrong'
			});
		}
	}

	async forgotPassword(email: string): Promise<ResponseType> {
		const user = await this.UserModel.findOne({ email });

		if (user) {
			const forgotPassword = new this.ForgotPasswordModel({
				user: user._id
			});

			await forgotPassword.save();

			// Send reset password email
			await this.emailConfigurationService.sendResetPasswordEmail(
				user.email,
				forgotPassword._id,
				dayjs(forgotPassword.createdAt).add(30, 'minutes').toDate()
			);
		}

		return {
			success: true,
			message: 'Reset password email sent'
		};
	}

	async updatePasswordWithToken(token: string, newPassword: string): Promise<ResponseType> {
		const forgotPassword = await this.ForgotPasswordModel.findById(token);

		if (!forgotPassword) {
			throw new BadRequestException({
				success: false,
				message: 'Invalid token'
			});
		}

		// Check if token is expired (30 minutes after creation)
		if (dayjs(forgotPassword.createdAt).add(30, 'minutes').isBefore(dayjs())) {
			await forgotPassword.remove();

			throw new BadRequestException({
				success: false,
				message: 'Token expired'
			});
		}

		const user = await this.UserModel.findById(forgotPassword.user);

		if (!user) {
			throw new BadRequestException({
				success: false,
				message: 'User not found'
			});
		}

		user.password = hashPassword(newPassword);

		await user.save();
		await forgotPassword.remove();

		return {
			success: true,
			message: 'Password updated successfully'
		};
	}

	async validateResetToken(token: string): Promise<ResponseType> {
		const forgotPassword = await this.ForgotPasswordModel.findById(token);

		if (!forgotPassword) {
			throw new BadRequestException({
				success: false,
				message: 'Invalid token'
			});
		}

		// Check if token is expired (30 minutes after creation)
		if (dayjs(forgotPassword.createdAt).add(30, 'minutes').isBefore(dayjs())) {
			await forgotPassword.remove();

			throw new BadRequestException({
				success: false,
				message: 'Token expired'
			});
		}

		return {
			success: true,
			message: 'Valid token'
		};
	}
}
