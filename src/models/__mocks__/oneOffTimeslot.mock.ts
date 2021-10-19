import { OneOffTimeslot, ServiceProvider } from '../entities';
import { getServiceProviderMock } from './serviceProvider.mock';

export const getOneOffTimeslotMock = ({ serviceProvider }: { serviceProvider?: ServiceProvider }): OneOffTimeslot => {
	const model = new OneOffTimeslot();
	model.id = 21;
	model.startDateTime = new Date('2022-01-01T14:00:00.000Z');
	model.endDateTime = new Date('2022-01-01T14:01:00.000Z');
	model.serviceProvider = serviceProvider || getServiceProviderMock({});
	return model;
};
