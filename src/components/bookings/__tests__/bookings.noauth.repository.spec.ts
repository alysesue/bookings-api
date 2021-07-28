import { BookingUUIDInfo } from '../../../models';
import { Container } from 'typescript-ioc';
import { TransactionManager } from '../../../core/transactionManager';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';
import { BookingsNoAuthRepository } from '../bookings.noauth.repository';

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

// tslint:disable-next-line: no-big-function
describe('Bookings no auth repository', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should get booking info by UUID', async () => {
		const repository = Container.get(BookingsNoAuthRepository);
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			select: jest.fn(() => queryBuilderMock),
			addSelect: jest.fn(() => queryBuilderMock),
			getRawOne: jest.fn<Promise<BookingUUIDInfo>, any>(),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		queryBuilderMock.getRawOne.mockReturnValue(
			Promise.resolve({
				bookingUUID: '0cb93245-90c2-4572-a6f4-c3326d501d98',
				bookingId: 1,
				serviceId: 2,
				organisationId: 3,
				serviceProviderId: 4,
			}),
		);

		const result = await repository.getBookingInfoByUUID('0cb93245-90c2-4572-a6f4-c3326d501d98');

		expect(queryBuilderMock.where).toBeCalledWith('booking."_uuid" = :bookingUUID', {
			bookingUUID: '0cb93245-90c2-4572-a6f4-c3326d501d98',
		});
		expect(result).toEqual({
			bookingUUID: '0cb93245-90c2-4572-a6f4-c3326d501d98',
			bookingId: 1,
			serviceId: 2,
			organisationId: 3,
			serviceProviderId: 4,
		});
	});
});
