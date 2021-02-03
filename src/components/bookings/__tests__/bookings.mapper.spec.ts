import { User } from '../../../models';
import { BookingsMapper } from '../bookings.mapper';

describe('Bookings mapper tests', () => {
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	const agencyMock = User.createAgencyUser({
		agencyAppId: 'LOCAL-APP',
		agencyName: 'local',
	});

	it('should mock nric, mask all characters except first and last 4 characters', async () => {
		const inputNRIC = 'S9269634J';
		const expected = 'S****634J';
		const result = BookingsMapper.maskNRIC(inputNRIC, adminMock);
		expect(result).toEqual(expected);
	});

	it('should not mock nric when user is agency user', async () => {
		const inputNRIC = 'S9269634J';
		const expected = 'S9269634J';
		const result = BookingsMapper.maskNRIC(inputNRIC, agencyMock);
		expect(result).toEqual(expected);
	});
});
