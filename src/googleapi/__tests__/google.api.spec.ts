import { GoogleApi } from "../google.api";

describe('Google api wrapper tests', () => {
	it('should return api', async () => {
		jest.mock("googleapis", () => ({
			google: {
				auth: {
					JWT: jest.fn(),
				},
			},
		}));
		const result = await new GoogleApi().getCalendarApi();

		expect(result);
	});
});
