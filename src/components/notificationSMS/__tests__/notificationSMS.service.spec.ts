import { NotificationSMSService, NotificationSMSServiceMol } from '../notificationSMS.service';
import { Container } from 'typescript-ioc';
import { post } from '../../../tools/fetch';
import {MOLAuthType, MOLSecurityHeaderKeys} from "mol-lib-api-contract/auth";
import {UserContextMock} from "../../../infrastructure/auth/__mocks__/userContext";
import {Organisation, Service, User} from "../../../models/entities";
import {UserContext} from "../../../infrastructure/auth/userContext";
import {BookingValidationType} from "../../../models";
import { SMSType } from "../../../models/SMSType";

jest.mock('../../../tools/fetch');

jest.mock('../../../config/app-config', () => {
	return {
		getConfig: () => ({
			name: 'test',
			version: '0.1',
			port: 3000,
			env: 'production',
			database: {
				host: 'host',
				port: '1111',
				instance: 'database',
				username: 'user',
			},
			molNotification: {
				url: '',
			},
		}),
	};
});

const adminMock = User.createAdminUser({
	molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
	userName: 'UserName',
	email: 'test@email.com',
	name: 'Name',
});

const organisation = Organisation.create('Organisation1', 1);

const service = Service.create('Service1', organisation);
service.id = 1;

describe('Test of notification SMS', () => {
	beforeAll(() => {
		(post as jest.Mock).mockImplementation(jest.fn());
		Container.bind(UserContext).to(UserContextMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
	});

	afterAll(() => {
		jest.resetAllMocks();
		if (global.gc) global.gc();
	});

	it('Should call post when sending an sms', async () => {
		await Container.get(NotificationSMSServiceMol).send({ phoneNumber: '+6588217161', message: '' }, organisation.name, service.id, BookingValidationType.Citizen, SMSType.BookingNotification);
		expect(post).toHaveBeenCalledTimes(1);
	});

	it("Should fail if there's no country code", async () => {
		const res = async () => await NotificationSMSService.validatePhone('88217161');
		await expect(res).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid phone number"');
	});

	it('Should succeed if Singapore or international number', async () => {
		await NotificationSMSService.validatePhone('+4488217160');
		await NotificationSMSService.validatePhone('+6588217160');
	});

	it('Should pass organisation, service ID, auth type and SMS type as header value when sending SMS', async () => {
		const SMSService = Container.get(NotificationSMSServiceMol);
		const headers = {
			[MOLSecurityHeaderKeys.AUTH_TYPE]: MOLAuthType.ADMIN,
			[MOLSecurityHeaderKeys.AGENCY_NAME]: 'SOME VALUE',
		};

		(SMSService as any).context = {headers};

		await SMSService.send({ phoneNumber: '+6588217161', message: '' }, organisation.name, service.id, BookingValidationType.Citizen, SMSType.BookingNotification);
		expect(post).toHaveBeenCalledWith("/sms/api/v2/send-batch", {"sms": [{"message": "", "phoneNumber": "+6588217161"}]}, {"mol-agency-name": "BSG-Organisation1-1-citizen-BookingNotification", "mol-auth-type": "SYSTEM"});
	});
});
