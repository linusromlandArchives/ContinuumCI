// Internal dependencies
import api from '.';
import { ResponseType } from 'shared/src/types';
import { ProjectClass, ProjectQueryClass } from 'shared/src/classes';

async function getAllProjects(): Promise<ResponseType> {
	const request = await api.get('/projects/all');

	return request.data as ResponseType;
}

async function getProject(
	projectId: string
): Promise<ResponseType<ProjectClass>> {
	const request = await api.get('/projects/' + projectId);

	return request.data as ResponseType<ProjectClass>;
}

async function createProject(data: ProjectQueryClass): Promise<ResponseType> {
	const request = await api.post('/projects/create', {
		...data,
		permissions: []
	});

	return request.data as ResponseType;
}

async function editProject(
	data: ProjectQueryClass,
	id: string
): Promise<ResponseType> {
	const request = await api.put('/projects/edit/' + id, data);

	return request.data as ResponseType;
}

export { getAllProjects, getProject, createProject, editProject };
