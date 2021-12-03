import { NotificationSMSService, NotificationSMSServiceMol } from '../notificationSMS.service';
import { Container } from 'typescript-ioc';
import { post } from '../../../tools/fetch';
import { MOLSecurityHeaderKeys } from "mol-lib-api-contract/auth";
import {UserContextMock} from "../../../infrastructure/auth/__mocks__/userContext";
import {User} from "../../../models/entities";
import {UserContext} from "../../../infrastructure/auth/userContext";

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

const agencyMock = User.createAgencyUser({
	agencyAppId: 'abcd1234',
	agencyName: 'AGENCY1',
});

describe('Test of notification SMS', () => {
	beforeAll(() => {
		(post as jest.Mock).mockImplementation(jest.fn());
		Container.bind(UserContext).to(UserContextMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(agencyMock));
	});

	afterAll(() => {
		jest.resetAllMocks();
		if (global.gc) global.gc();
	});

	it('Should call post when sending an sms', async () => {
		await Container.get(NotificationSMSServiceMol).send({ phoneNumber: '+6588217161', message: '' });
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

	it('Should pass through headers properly when sending SMS', async () => {
		const SMSService = Container.get(NotificationSMSServiceMol);
		const headers = {
			[MOLSecurityHeaderKeys.AUTH_TYPE]: 'agency',
			[MOLSecurityHeaderKeys.AGENCY_NAME]: 'AGENCY1',
		};

		(SMSService as any).context = {headers};

		await SMSService.send({ phoneNumber: '+6588217161', message: '' });
		expect(post).toHaveBeenCalledWith("/sms/api/v2/send-batch", {"sms": [{"message": "", "phoneNumber": "+6588217161"}]}, {"mol-agency-name": "AGENCY1", "mol-auth-type": "SYSTEM"});
	});
});
