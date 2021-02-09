import { Container } from 'typescript-ioc';
import { MolUsersServiceFactory } from '../molUsers.service';
import { post } from '../../../../tools/fetch';
import { getConfig } from '../../../../config/app-config';
import { IMolCognitoUserRequest } from '../molUsers.apicontract';

jest.mock('../../../../tools/fetch', () => ({
	get: jest.fn(),
	post: jest.fn(),
}));

jest.mock('../../../../config/app-config', () => ({
	getConfig: jest.fn(),
}));

describe('Test class MolUsersService', () => {
	afterAll(() => {
		jest.resetAllMocks();
		if (global.gc) global.gc();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('Should call post when isLocal = false', async () => {
		const user = { email: 'tintin' };
		(post as jest.Mock).mockReturnValue({ user });
		(getConfig as jest.Mock).mockReturnValue({ isLocal: false, molAdminAuthForwarder: { url: 'url' } });
		const service = Container.get(MolUsersServiceFactory).getService();
		await service.molUpsertUser([]);
		expect(post).toBeCalledTimes(1);
	});

	it('Should have header with EMAIL value when sendEmail true', async () => {
		const user = { email: 'tintin' };
		(post as jest.Mock).mockReturnValue({ user });
		(getConfig as jest.Mock).mockReturnValue({ isLocal: false, molAdminAuthForwarder: { url: 'url' } });
		const service = Container.get(MolUsersServiceFactory).getService();
		await service.molUpsertUser([], { token: '', desiredDeliveryMediumsHeader: 'EMAIL' });
		expect(post).toBeCalledTimes(1);
		expect((post as jest.Mock).mock.calls[0][2]['desired-delivery-medium']).toBe('EMAIL');
	});

	it('Should not call post when isLocal = true', async () => {
		(getConfig as jest.Mock).mockReturnValue({ isLocal: true, molAdminAuthForwarder: { url: 'url' } });
		const user = {
			name: 'name',
			email: '',
			phoneNumber: '',
			agencyUserId: '123',
			uinfin: 'sd',
		};
		const service = Container.get(MolUsersServiceFactory).getService();
		await service.molUpsertUser([user as IMolCognitoUserRequest]);
		expect(post).toBeCalledTimes(0);
	});

	it('Should throw exception if no identifier', async () => {
		(getConfig as jest.Mock).mockReturnValue({ isLocal: true, molAdminAuthForwarder: { url: 'url' } });
		const user = {
			name: 'name',
			phoneNumber: '',
		};
		const service = Container.get(MolUsersServiceFactory).getService();
		try {
			await service.molUpsertUser([user as IMolCognitoUserRequest]);
		} catch (e) {
			expect(e.message).toBe('MolUsersServiceLocal: User name undefined');
		}
	});
});
