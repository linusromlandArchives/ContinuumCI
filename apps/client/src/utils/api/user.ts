// Internal dependencies
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

async function getUser(): Promise<ResponseType> {
	const request = await api.get('/profile');

	return request.data;
}

export { createUser, getUser };
