import { Booking, Organisation, Service, User } from '../../../models';
import { BookingsMapper } from '../bookings.mapper';
import { UinFinConfiguration } from '../../../models/uinFinConfiguration';

jest.mock('../../../models/uinFinConfiguration');

describe('Bookings mapper tests', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		(UinFinConfiguration as jest.Mock).mockImplementation(() => new UinFinConfigurationMock());
	});

	const userMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	it('should throw if organisation not loaded', async () => {
		const booking = new Booking();
		booking.citizenUinFin = 'S9269634J';

		const testCase = () => BookingsMapper.maskUinFin(booking, { user: userMock, authGroups: [] });
		expect(testCase).toThrowErrorMatchingInlineSnapshot(
			'"Booking -> service -> organisation not loaded. BookingsMapper requires it."',
		);
	});

	it('should mask nric, mask all characters except first and last 4 characters', async () => {
		const booking = new Booking();
		booking.citizenUinFin = 'S9269634J';
		booking.service = new Service();
		booking.service.organisation = new Organisation();

		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(false);

		const result = BookingsMapper.maskUinFin(booking, { user: userMock, authGroups: [] });
		expect(result).toEqual('S****634J');
	});

	it('should not mask nric depending on uinfin configuration ', async () => {
		const booking = new Booking();
		booking.citizenUinFin = 'S9269634J';
		booking.service = new Service();
		booking.service.organisation = new Organisation();
		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(true);

		const result = BookingsMapper.maskUinFin(booking, { user: userMock, authGroups: [] });
		expect(result).toEqual('S9269634J');
	});
});

class UinFinConfigurationMock implements Partial<UinFinConfiguration> {
	public static canViewPlainUinFin = jest.fn<boolean, any>();
	public canViewPlainUinFin(...params): any {
		return UinFinConfigurationMock.canViewPlainUinFin(...params);
	}
}
