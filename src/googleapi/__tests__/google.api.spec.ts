import { Credentials, JWT, JWTInput } from 'google-auth-library';
import * as authModule from 'google-auth-library';
import { GoogleApi } from '../google.api';
import { config } from '../../config/app-config';

jest.mock('../../config/app-config', () => {
	const configMock = {
		serviceAccount: '{}'
	};

	return {
		config: configMock
	};
});

jest.mock('google-auth-library', () => {
	const actual = jest.requireActual('google-auth-library');
	const authorizeMock = jest.fn(() => ({}));

	class JWTMock {
		public fromJSON(json: JWTInput) {
		}

		public createScoped(scopes?: string | string[]): JWT {
			return this as unknown as JWT;
		}

		public async authorize(): Promise<Credentials> {
			return authorizeMock();
		}
	}

	return {
		...actual,
		JWT: JWTMock,
		authorizeMock
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
