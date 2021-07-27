import { Container } from 'typescript-ioc';
import { UserSessionsController } from '../usersessions.controller';
import {
	BookingSGCookieHelper,
	MolCookieHelper,
	MobileOtpCookieHelper,
} from '../../../infrastructure/bookingSGCookieHelper';
import { OtpService } from '../../otp/otp.service';

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

const MobileOtpCookieHelperMock = {
	setCookieValue: jest.fn(),
};

const OtpServiceMock = {
	sendOtp: jest.fn(),
};

beforeAll(() => {
	Container.bind(BookingSGCookieHelper).factory(() => BookingSGCookieHelperMock);
	Container.bind(MolCookieHelper).factory(() => MolCookieHelperMock);
	Container.bind(MobileOtpCookieHelper).factory(() => MobileOtpCookieHelperMock);
	Container.bind(OtpService).factory(() => OtpServiceMock);
});

beforeEach(() => {
	jest.resetAllMocks();
});

describe('user sessions controller', () => {
	it('create anonymous session', async () => {
		const controller = Container.get(UserSessionsController);

		await controller.createAnonymous();
		expect(BookingSGCookieHelperMock.setCookieValue).toHaveBeenCalled();
		expect(MolCookieHelperMock.delete).toHaveBeenCalled();
	});
});
