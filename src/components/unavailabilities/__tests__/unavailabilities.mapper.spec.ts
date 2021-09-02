import { Container } from 'typescript-ioc';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { ServiceProvider, Unavailability } from '../../../models/entities';
// import { UinFinConfiguration } from '../../../models/uinFinConfiguration';
import { UnavailabilitiesMapperV1, UnavailabilitiesMapperV2 } from '../unavailabilities.mapper';
import {
	ServiceProviderSummaryModelV1,
	ServiceProviderSummaryModelV2,
} from '../../serviceProviders/serviceProviders.apicontract';

describe('Unavailabilities Mapper V1', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should map unavailabilities response', () => {
		const unavailability = new Unavailability();
		unavailability.allServiceProviders = true;
		unavailability.id = 1;
		unavailability.serviceProviders = [ServiceProvider.create('SP1', 1), ServiceProvider.create('SP2', 1)];
		unavailability.start = new Date('2020-09-26T00:00:00.000Z');
		unavailability.end = new Date('2020-09-26T00:30:00.000Z');

		const mapper = Container.get(UnavailabilitiesMapperV1);
		const res = mapper.mapToResponse(unavailability);

		expect(res.id).toBe(1);
		expect(res.allServiceProviders).toBe(true);
		expect(res.serviceProviders).toEqual([
			new ServiceProviderSummaryModelV1(undefined, 'SP1'),
			new ServiceProviderSummaryModelV1(undefined, 'SP2'),
		]);
		expect(res.startTime.toISOString()).toBe('2020-09-26T00:00:00.000Z');
		expect(res.endTime.toISOString()).toBe('2020-09-26T00:30:00.000Z');
	});
});

describe('Unavailabilities Mapper V2', () => {
	beforeAll(() => {
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should map unavailabilities response', () => {
		const unavailability = new Unavailability();
		unavailability.allServiceProviders = true;
		unavailability.id = 1;
		unavailability.serviceProviders = [ServiceProvider.create('SP1', 1), ServiceProvider.create('SP2', 1)];
		unavailability.serviceProviders[0].id = 1;
		unavailability.serviceProviders[1].id = 2;
		unavailability.start = new Date('2020-09-26T00:00:00.000Z');
		unavailability.end = new Date('2020-09-26T00:30:00.000Z');

		IdHasherMock.encode.mockImplementation((id: number) => String(id));

		const mapper = Container.get(UnavailabilitiesMapperV2);
		const res = mapper.mapToResponse(unavailability);

		expect(res.id).toBe('1');
		expect(res.allServiceProviders).toBe(true);
		expect(res.serviceProviders).toEqual([
			new ServiceProviderSummaryModelV2('1', 'SP1'),
			new ServiceProviderSummaryModelV2('2', 'SP2'),
		]);
		expect(res.startTime.toISOString()).toBe('2020-09-26T00:00:00.000Z');
		expect(res.endTime.toISOString()).toBe('2020-09-26T00:30:00.000Z');
	});
});
