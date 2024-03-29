// Internal dependencies
import { UserClass } from 'shared/src/classes';
import { ResponseType } from 'shared/src/types';
import api from './';

async function createUser({
	username,
	email,
	password
}: {
	username: string;
	email: string;
	password: string;
}): Promise<boolean> {
	const request = await api.post('/users/create', {
		username,
		email,
		password
	});

	return request.data.success;
}

async function getUser(): Promise<ResponseType<UserClass>> {
	const request = await api.get('/profile');

	return request.data;
}

async function resendVerificationEmail(): Promise<ResponseType<UserClass>> {
	const request = await api.get('/users/verify/resend');

	return request.data;
}

async function getUsers(): Promise<ResponseType<UserClass[]>> {
	const request = await api.get('/users/all');

	return request.data;
}

async function updateUsername(username: string): Promise<ResponseType> {
	const request = await api.put('/users/edit/username', {
		username
	});

	return request.data;
}

async function updateEmail(email: string): Promise<ResponseType> {
	const request = await api.put('/users/edit/email', {
		email
	});

	return request.data;
}

async function updatePassword(oldPassword: string, newPassword: string): Promise<ResponseType> {
	const request = await api.put('/users/edit/password', {
		oldPassword,
		newPassword
	});

	return request.data;
}

async function updateRole(userId: string, role: string): Promise<ResponseType> {
	const request = await api.put('/users/edit/role', {
		userId,
		role
	});

	return request.data;
}

async function resetPassword(email: string): Promise<ResponseType> {
	const request = await api.post('/users/forgotPassword', {
		email
	});

	return request.data;
}

async function updatePasswordWithResetToken(token: string, password: string): Promise<ResponseType> {
	const request = await api.post('/users/resetPassword', {
		token,
		password
	});

	return request.data;
}

async function validateResetToken(token: string): Promise<ResponseType> {
	const request = await api.get('/users/validateResetToken/' + token);

	return request.data;
}

export {
	createUser,
	getUser,
	getUsers,
	resendVerificationEmail,
	updateUsername,
	updateEmail,
	updatePassword,
	updateRole,
	resetPassword,
	updatePasswordWithResetToken,
	validateResetToken
};
