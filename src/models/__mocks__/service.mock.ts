import { Organisation, Service } from '../entities';

export const getServiceMock = ({ name, id }: { name?: string; id?: number }): Service => {
	const service = Service.create(name || 'ServiceName', new Organisation());
	service.id = id || 10;
	return service;
};
