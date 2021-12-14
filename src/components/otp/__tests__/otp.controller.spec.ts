import { OtpServiceMock } from './../__mocks__/otp.service.mock';
import { MobileOtpCookieHelper, MolCookieHelper } from './../../../infrastructure/bookingSGCookieHelper';
import { OtpVerifyRequest } from './../otp.apicontract';
import { OtpController } from '../otp.controller';
import { Container } from 'typescript-ioc';
import { OtpSendRequest } from '../otp.apicontract';
import { OtpService } from '../otp.service';
import * as uuid from 'uuid';
import { MobileOtpCookieHelperMock } from '../../../infrastructure/__mocks__/mobileOtpCookieHelper.mock';
import {IdHasher} from "../../../infrastructure/idHasher";
import {IdHasherMock} from "../../../infrastructure/__mocks__/idHasher.mock";
import {UserContext} from "../../../infrastructure/auth/userContext";
import {UserContextMock} from "../../../infrastructure/auth/__mocks__/userContext";
import {OrganisationAdminAuthGroup} from "../../../infrastructure/auth/authGroup";
import {Organisation, Service, User} from "../../../models/entities";
import {ServicesService} from "../../services/services.service";
import {ServicesServiceMock} from "../../services/__mocks__/services.service";

const adminMock = User.createAdminUser({
	molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
	userName: 'UserName',
	email: 'test@email.com',
	name: 'Name',
});

const organisation = new Organisation();
organisation.id = 1;
organisation.name = 'Organisation1';

beforeAll(() => {
	Container.bind(OtpService).to(OtpServiceMock);
	Container.bind(MobileOtpCookieHelper).to(MobileOtpCookieHelperMock);
	Container.bind(MolCookieHelper).factory(() => MolCookieHelperMock);
	Container.bind(IdHasher).to(IdHasherMock);
	Container.bind(UserContext).to(UserContextMock);
	Container.bind(ServicesService).to(ServicesServiceMock);
});

beforeEach(() => {
	OtpServiceMock.sendOtpMock.mockImplementation(async (): Promise<string> => {
		return Promise.resolve(uuid.v4());
	});
	IdHasherMock.decode.mockImplementation((id: string) => Number.parseInt(id, 10));
	UserContextMock.getAuthGroups.mockImplementation(() =>
		Promise.resolve([new OrganisationAdminAuthGroup(adminMock, [organisation])]),
	);
	ServicesServiceMock.getService.mockImplementation(() =>
		Promise.resolve(Service.create('Service1', organisation)),
	);
});

afterEach(() => {
	jest.resetAllMocks();
});

describe('OTP controller', () => {
	it('sends OTP for mobile login', async () => {
		const controller = Container.get(OtpController);

		const otpSendResponse = await controller.sendOtp(new OtpSendRequest('+6588884444'));
		expect(OtpServiceMock.sendOtpMock).toBeCalledTimes(1);
		expect(uuid.validate(otpSendResponse.data.otpRequestId)).toBeTruthy();
	});

	it('verify OTP for mobile login', async () => {
		const controller = Container.get(OtpController);

		await controller.verifyOtp(new OtpVerifyRequest('6dd2513a-9679-49d2-b305-94a390d151ad', '011111'));
		expect(OtpServiceMock.verifyOtpMock).toBeCalledTimes(1);
		expect(MobileOtpCookieHelperMock.setCookieValue).toBeCalledTimes(1);
	});

	it('verify OTP and refresh token', async () => {
		const controller = Container.get(OtpController);

		await controller.refreshOtpToken();
		expect(OtpServiceMock.verifyAndRefreshTokenMock).toBeCalledTimes(1);
	});
});
