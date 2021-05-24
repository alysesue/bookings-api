import * as authModule from 'google-auth-library';
import { Credentials, JWT } from 'google-auth-library';
import { GoogleApi } from '../google.api';

jest.mock('../../config/app-config', () => {
	const configMock = {};

	return {
		getConfig: () => configMock,
	};
});

jest.mock('google-auth-library', () => {
	const actual = jest.requireActual('google-auth-library');
	const authorizeMock = jest.fn(() => ({}));

	class JWTMock {
		public fromJSON() {}

		public createScoped(): JWT {
			return (this as unknown) as JWT;
		}

		public async authorize(): Promise<Credentials> {
			return authorizeMock();
		}
	}

	return {
		...actual,
		JWT: JWTMock,
		authorizeMock,
	};
});

beforeEach(() => jest.clearAllMocks());

describe('Google api wrapper tests', () => {
	it('should return api', async () => {
		const authorizeMock = authModule['authorizeMock'] as Function;
		const result = await new GoogleApi().getCalendarApi();

		expect(result);
		expect(authorizeMock).toBeCalledTimes(1);
	});

	it('should not authorize again when getting calendar more than once', async () => {
		const authorizeMock = authModule['authorizeMock'] as Function;
		const api = new GoogleApi();

		await api.getCalendarApi();
		await api.getCalendarApi();

		expect(authorizeMock).toBeCalledTimes(1);
	});
});
