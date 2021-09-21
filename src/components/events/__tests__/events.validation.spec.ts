import { ContainerContextHolder } from '../../../infrastructure/containerContext';
import { Container } from 'typescript-ioc';
import { EventsValidation } from '../events.validation';
import { Event } from '../../../models/entities/event';
import { getServiceProviderMock } from '../../../models/__mocks__/serviceProvider.mock';
import { getServiceMock } from '../../../models/__mocks__/service.mock';
import { getOneOffTimeslotMock } from '../../../models/__mocks__/oneOffTimeslot.mock';

beforeAll(() => {
	ContainerContextHolder.registerInContainer();
});

describe('Validation of events', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('Should return multiple errors due to validation ', async () => {
		const event = new Event();
		event.oneOffTimeslots = [];
		let longStr = '';
		while (longStr.length < 4001) {
			longStr += 'tttttttttttttttttttttttttttttttttttttttt';
		}
		event.title =
			'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii';
		event.description = longStr;
		const eventsValidation = Container.get(EventsValidation);
		const validate = async () => await eventsValidation.validate(event);
		await expect(validate).rejects.toThrow('[10101] Title word limit is 100 characters');
		await expect(validate).rejects.toThrow('[10103] Description word limit is 4000 characters');
	});

	it('Should return error if not the same service ', async () => {
		const event = new Event();
		const sp1 = getServiceProviderMock({ service: getServiceMock({ id: 11 }) });
		const sp2 = getServiceProviderMock({ service: getServiceMock({ id: 10 }) });
		const oneOffTimeslot1 = getOneOffTimeslotMock({ serviceProvider: sp1 });
		const oneOffTimeslot2 = getOneOffTimeslotMock({ serviceProvider: sp2 });
		event.oneOffTimeslots = [oneOffTimeslot1, oneOffTimeslot2];
		const eventsValidation = Container.get(EventsValidation);
		const validate = async () => await eventsValidation.validate(event);
		await expect(validate).rejects.toThrow('[10104] Service providers should be part of the same service');
	});

	it('Should have no error if empty', async () => {
		const event = new Event();
		const eventsValidation = Container.get(EventsValidation);
		const validate = async () => await eventsValidation.validate(event);
		await expect(validate).rejects.toThrow('[10105] Event should have at least one slot');
	});
});
