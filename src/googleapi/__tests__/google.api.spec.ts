import { Credentials, JWT, JWTInput } from 'google-auth-library';
import * as authModule from 'google-auth-library';
import { GoogleApi } from '../google.api';

jest.mock('google-auth-library', () => {
	const actual = jest.requireActual('google-auth-library');
	const authorizeMock = jest.fn(() => ({}));

	class JWTWrapper {
		private _jwt: JWT;
		constructor(...params) {
			this._jwt = new actual.JWT(params);
		}

		public fromJSON(json: JWTInput) {
			this._jwt.fromJSON(json);
		}

		public createScoped(scopes?: string | string[]): JWT {
			this._jwt = this._jwt.createScoped(scopes);
			return this as unknown as JWT;
		}

		public async authorize(): Promise<Credentials> {
			return authorizeMock();
		}
	}

	return {
		...actual,
		JWT: JWTWrapper,
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
