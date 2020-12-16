import { Container } from 'typescript-ioc';
import { UserSessionsController } from '../usersessions.controller';
import { BookingSGCookieHelper, MolCookieHelper } from '../../../infrastructure/bookingSGCookieHelper';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const BookingSGCookieHelperMock = {
	setCookieValue: jest.fn(),
};

const MolCookieHelperMock = {
	delete: jest.fn(),
};

beforeAll(() => {
	Container.bind(BookingSGCookieHelper).factory(() => BookingSGCookieHelperMock);
	Container.bind(MolCookieHelper).factory(() => MolCookieHelperMock);
});

beforeEach(() => {
	jest.resetAllMocks();
});

describe('user serssions controller', () => {
	it('create anonymous session', async () => {
		const controller = Container.get(UserSessionsController);

		await controller.createAnonymous();
		expect(BookingSGCookieHelperMock.setCookieValue).toHaveBeenCalled();
		expect(MolCookieHelperMock.delete).toHaveBeenCalled();
	});
});
