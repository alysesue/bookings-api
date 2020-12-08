import { Container } from 'typescript-ioc';
import { MolUsersService } from '../molUsers.service';
import { get, post } from '../../../../tools/fetch';
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

	it('Should call get when no local', async () => {
		const user = { email: 'tintin' };
		(get as jest.Mock).mockReturnValue({ user });
		(getConfig as jest.Mock).mockReturnValue({ isLocal: false, molAdminAuthForwarder: { url: 'url' } });
		const results = await Container.get(MolUsersService).molGetUser({ email: 'as@ad.com', uinfin: 's' });
		expect(get).toBeCalledTimes(1);
		expect(results.user).toBe(user);
	});

	it('Should not call get when no local', async () => {
		(getConfig as jest.Mock).mockReturnValue({ isLocal: true, molAdminAuthForwarder: { url: 'url' } });
		await Container.get(MolUsersService).molGetUser({ email: 'as@ad.com', uinfin: 's' });
		expect(get).toBeCalledTimes(0);
	});

	it('Should call post when no local', async () => {
		const user = { email: 'tintin' };
		(post as jest.Mock).mockReturnValue({ user });
		(getConfig as jest.Mock).mockReturnValue({ isLocal: false, molAdminAuthForwarder: { url: 'url' } });
		await Container.get(MolUsersService).molUpsertUser([]);
		expect(post).toBeCalledTimes(1);
	});

	it('Should not call post when local', async () => {
		(getConfig as jest.Mock).mockReturnValue({ isLocal: true, molAdminAuthForwarder: { url: 'url' } });
		await Container.get(MolUsersService).molUpsertUser([]);
		expect(post).toBeCalledTimes(0);
	});
});
