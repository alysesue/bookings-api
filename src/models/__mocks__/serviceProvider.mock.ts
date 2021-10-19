import { Service, ServiceProvider } from '../entities';
import { getServiceMock } from './service.mock';

export const getServiceProviderMock = ({
	name,
	service,
	id,
}: {
	name?: string;
	service?: Service;
	id?: number;
}): ServiceProvider => {
	const spService = service || getServiceMock({});
	const sp = ServiceProvider.create(name || 'ServiceProviderName', spService.id);
	sp.service = spService;
	sp.id = id;

	return sp;
};
