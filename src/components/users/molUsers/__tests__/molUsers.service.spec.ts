import { Container } from 'typescript-ioc';
import { MolUsersServiceFactory } from '../molUsers.service';
import { post } from '../../../../tools/fetch';
import { getConfig } from '../../../../config/app-config';

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

	it('Should not call post when isLocal = true', async () => {
		(getConfig as jest.Mock).mockReturnValue({ isLocal: true, molAdminAuthForwarder: { url: 'url' } });
		const service = Container.get(MolUsersServiceFactory).getService();
		await service.molUpsertUser([]);
		expect(post).toBeCalledTimes(0);
	});
});
