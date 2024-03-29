// External dependencies
import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Model } from 'mongoose';
import nodemailer from 'nodemailer';
import dayjs from 'dayjs';

// Internal dependencies
import { ResponseType } from 'shared/src/types';
import { EmailConfigurationClass, EmailConfigurationQueryClass } from 'shared/src/classes';
import { CLIENT_HOST, API_HOST } from '../../utils/env';
import emailTemplate from '../../utils/emailTemplate';
import { EmailConfigurationServiceEnum } from 'shared/src/enums';

@Injectable()
export class EmailConfigurationService {
	constructor(
		@Inject('EMAIL_CONFIGURATION_MODEL')
		private EmailConfigurationModel: Model<EmailConfigurationClass>
	) {}

	async create(emailConfiguration: EmailConfigurationQueryClass): Promise<ResponseType> {
		try {
			//Verify the email configuration
			if (
				emailConfiguration.service !== EmailConfigurationServiceEnum.SKIPPED &&
				!(await this.verifyEmailConfiguration(emailConfiguration))
			) {
				throw new BadRequestException({
					success: false,
					message: 'Invalid email configuration'
				});
			}

			//Save the email configuration
			try {
				await this.EmailConfigurationModel.updateOne({}, emailConfiguration, { upsert: true });
				return {
					success: true,
					message: 'Email configuration saved successfully'
				};
			} catch (error) {
				throw new BadRequestException({
					success: false,
					message: 'Invalid email configuration'
				});
			}
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw error;
			}

			throw new InternalServerErrorException({
				success: false,
				message: (error as string | null) || 'Something went wrong'
			});
		}
	}

	async checkEmailConfiguration(): Promise<ResponseType> {
		try {
			const emailConfiguration = await this.EmailConfigurationModel.findOne().lean();

			if (!emailConfiguration) {
				throw new InternalServerErrorException({
					success: false,
					message: 'Email configuration not found'
				});
			}

			const verifiedEmailConfiguration = await this.verifyEmailConfiguration(emailConfiguration);

			return {
				success: verifiedEmailConfiguration,
				message: verifiedEmailConfiguration
					? 'Email configuration verified successfully'
					: 'Invalid email configuration'
			};
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw error;
			}

			throw new InternalServerErrorException({
				success: false,
				message: (error as string | null) || 'Something went wrong'
			});
		}
	}

	async verifyEmailConfiguration(emailConfiguration: EmailConfigurationQueryClass): Promise<boolean> {
		//Test the email configuration
		const transporter = nodemailer.createTransport({
			service: emailConfiguration.service,
			auth: {
				user: emailConfiguration.auth.user,
				pass: emailConfiguration.auth.pass
			}
		});

		try {
			await transporter.verify();
			return true;
		} catch (error) {
			return false;
		}
	}

	async get(): Promise<ResponseType<EmailConfigurationClass>> {
		return await this.EmailConfigurationModel.findOne().select('-_id -__v').lean();
	}

	async configured(): Promise<ResponseType<boolean>> {
		const emailConfiguration = await this.EmailConfigurationModel.findOne({
			service: { $ne: EmailConfigurationServiceEnum.SKIPPED }
		}).lean();

		return {
			success: true,
			message: 'Email configuration configured check',
			data: !!emailConfiguration
		};
	}

	async sendVerificationEmail(email: string, verificationToken: string, expires: Date): Promise<ResponseType> {
		try {
			const emailConfiguration = await this.EmailConfigurationModel.findOne().lean();

			if (!emailConfiguration) {
				throw new InternalServerErrorException({
					success: false,
					message: 'Email configuration not found'
				});
			}

			const transporter = nodemailer.createTransport({
				service: emailConfiguration.service,
				auth: {
					user: emailConfiguration.auth.user,
					pass: emailConfiguration.auth.pass
				}
			});

			await transporter.sendMail({
				from: emailConfiguration.auth.user,
				to: email,
				subject: 'Verify your email',
				html: emailTemplate('verifyAccount', {
					name: email,
					url: `${API_HOST}/users/verify/${verificationToken}`,
					expires: dayjs(expires).format('DD MMMM YYYY HH:mm')
				})
			});

			return {
				success: true,
				message: 'Verification email sent successfully'
			};
		} catch (error) {
			if (error instanceof InternalServerErrorException) {
				throw error;
			}

			throw new InternalServerErrorException({
				success: false,
				message: (error as string | null) || 'Something went wrong'
			});
		}
	}

	async sendResetPasswordEmail(email: string, verificationToken: string, expires: Date): Promise<ResponseType> {
		try {
			const emailConfiguration = await this.EmailConfigurationModel.findOne().lean();

			if (!emailConfiguration) {
				throw new InternalServerErrorException({
					success: false,
					message: 'Email configuration not found'
				});
			}

			const transporter = nodemailer.createTransport({
				service: emailConfiguration.service,
				auth: {
					user: emailConfiguration.auth.user,
					pass: emailConfiguration.auth.pass
				}
			});

			await transporter.sendMail({
				from: emailConfiguration.auth.user,
				to: email,
				subject: 'Reset your password',
				html: emailTemplate('resetPassword', {
					url: `${CLIENT_HOST}/newPassword/${verificationToken}`,
					expires: dayjs(expires).format('DD MMMM YYYY HH:mm')
				})
			});

			return {
				success: true,
				message: 'Reset password email sent successfully'
			};
		} catch (error) {
			if (error instanceof InternalServerErrorException) {
				throw error;
			}

			throw new InternalServerErrorException({
				success: false,
				message: (error as string | null) || 'Something went wrong'
			});
		}
	}
}
