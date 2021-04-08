import { AvailableTimeslotProviders } from '../availableTimeslotProviders';
import { ServiceProvider, User } from '../../../models';
import { TimeslotsMapper } from '../timeslots.mapper';
import { TimeslotWithCapacity } from '../../../models/timeslotWithCapacity';
import { UinFinConfiguration } from '../../../models/uinFinConfiguration';
import { Container } from 'typescript-ioc';
import { TimeslotsMapperMock } from '../__mocks__/timeslots.mapper';

jest.mock('../../../models/uinFinConfiguration');

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});
beforeEach(() => {
	jest.resetAllMocks();
	(UinFinConfiguration as jest.Mock).mockImplementation(() => new UinFinConfigurationMock());
	Container.bind(TimeslotsMapper).to(TimeslotsMapperMock);
});

describe('Timeslots Mapper', () => {
	it('should map availability', () => {
		const entry = new AvailableTimeslotProviders();
		entry.startTime = new Date('2020-09-26T00:00:00.000Z').getTime();
		entry.endTime = new Date('2020-09-26T00:30:00.000Z').getTime();

		const spData = ServiceProvider.create('Timmy', 1);
		spData.id = 1;
		const map = new Map<ServiceProvider, TimeslotWithCapacity>();
		map.set(spData, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 1,
		} as TimeslotWithCapacity);

		entry.setRelatedServiceProviders(map);

		const res = TimeslotsMapper.mapAvailabilityToResponse([entry], {})[0];

		expect(res.availabilityCount).toBe(1);
		expect(res.startTime.toISOString()).toBe('2020-09-26T00:00:00.000Z');
		expect(res.endTime.toISOString()).toBe('2020-09-26T00:30:00.000Z');
	});

	it('should map service provider timeslot', () => {
		const entry = new AvailableTimeslotProviders();
		entry.startTime = new Date(2020, 8, 26, 8, 0).getTime();
		entry.endTime = new Date(2020, 8, 26, 8, 30).getTime();

		const serviceProvider1 = ServiceProvider.create('Timmy', 1);
		serviceProvider1.id = 1;
		const serviceProvider2 = ServiceProvider.create('Andy', 1);
		serviceProvider2.id = 2;

		const map = new Map<ServiceProvider, TimeslotWithCapacity>();
		map.set(serviceProvider1, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 1,
		} as TimeslotWithCapacity);
		map.set(serviceProvider2, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 5,
		} as TimeslotWithCapacity);
		entry.setRelatedServiceProviders(map);

		const timeslotServiceProviders = Array.from(entry.getTimeslotServiceProviders());
		const adminMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});
		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(false);

		const res = TimeslotsMapper.mapTimeslotServiceProviders(timeslotServiceProviders, {
			user: adminMock,
			authGroups: [],
		});
		const [spResponse, totalCapacity, totalBooked] = res;
		expect(spResponse.length).toBe(2);
		expect(spResponse[0].capacity).toBe(1);
		expect(spResponse[1].capacity).toBe(5);
		expect(totalCapacity).toBe(6);
		expect(totalBooked).toBe(0);
	});
});

class UinFinConfigurationMock implements Partial<UinFinConfiguration> {
	public static canViewPlainUinFin = jest.fn<boolean, any>();
	public canViewPlainUinFin(...params): any {
		return UinFinConfigurationMock.canViewPlainUinFin(...params);
	}
}
